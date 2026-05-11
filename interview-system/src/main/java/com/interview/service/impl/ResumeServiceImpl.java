package com.interview.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.common.BusinessException;
import com.interview.dto.response.ResumeParseResp;
import com.interview.dto.response.ResumeSummary;
import com.interview.dto.response.ResumeUploadResp;
import com.interview.entity.Resume;
import com.interview.repository.ResumeMapper;
import com.interview.service.ResumeService;
import com.interview.utils.AIClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeServiceImpl implements ResumeService {

    private final ResumeMapper resumeMapper;
    private final AIClient aiClient;
    private final ObjectMapper objectMapper;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public ResumeUploadResp upload(Long userId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException("上传文件不能为空");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new BusinessException("文件名不能为空");
        }

        String suffix = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        if (!List.of("pdf", "docx").contains(suffix)) {
            throw new BusinessException("仅支持 PDF 和 DOCX 格式");
        }

        String savedName = UUID.randomUUID().toString().replace("-", "") + "." + suffix;
        Path uploadPath = Paths.get(uploadDir);

        try {
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            file.transferTo(uploadPath.resolve(savedName).toFile());
        } catch (IOException e) {
            log.error("文件存储失败", e);
            throw new BusinessException("文件上传失败");
        }

        Resume resume = new Resume();
        resume.setUserId(userId);
        resume.setFileName(originalFilename);
        resume.setFilePath(uploadPath.resolve(savedName).toString());
        resume.setFileSize(file.getSize());
        resume.setFileType(suffix);
        resume.setDeleted(0);
        resumeMapper.insert(resume);

        ResumeUploadResp resp = new ResumeUploadResp();
        resp.setResumeId(resume.getId());
        resp.setFileName(originalFilename);
        resp.setStatus("uploaded");
        return resp;
    }

    @Override
    public ResumeParseResp parse(Long resumeId) {
        Resume resume = resumeMapper.selectById(resumeId);
        if (resume == null || resume.getDeleted() == 1) {
            throw new BusinessException("简历不存在");
        }

        String text = extractText(resume.getFilePath(), resume.getFileType());

        ResumeSummary summary = analyzeWithAi(text);

        resume.setParsedText(text);
        resume.setAiSummary(objectMapper.valueToTree(summary).toString());
        resumeMapper.updateById(resume);

        ResumeParseResp resp = new ResumeParseResp();
        resp.setResumeId(resume.getId());
        resp.setParsedText(text);
        resp.setSummary(summary);
        return resp;
    }

    @Override
    public Resume getResume(Long resumeId) {
        return resumeMapper.selectById(resumeId);
    }

    private String extractText(String filePath, String fileType) {
        try {
            if ("pdf".equals(fileType)) {
                return extractPdfText(filePath);
            } else if ("docx".equals(fileType)) {
                return extractDocxText(filePath);
            } else {
                throw new BusinessException("不支持的文件类型: " + fileType);
            }
        } catch (IOException e) {
            log.error("文件解析失败: {}", filePath, e);
            throw new BusinessException("文件解析失败");
        }
    }

    private String extractPdfText(String filePath) throws IOException {
        File file = new File(filePath);
        try (PDDocument document = Loader.loadPDF(file)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String extractDocxText(String filePath) throws IOException {
        try (InputStream is = Files.newInputStream(Paths.get(filePath));
             XWPFDocument document = new XWPFDocument(is)) {
            StringBuilder sb = new StringBuilder();
            for (XWPFParagraph para : document.getParagraphs()) {
                String text = para.getText();
                if (text != null && !text.isBlank()) {
                    sb.append(text).append("\n");
                }
            }
            return sb.toString();
        }
    }

    private ResumeSummary analyzeWithAi(String resumeText) {
        String promptTemplate = loadPromptTemplate();
        String prompt = promptTemplate.replace("{resumeText}", resumeText);

        String response = aiClient.chat(prompt);

        String json = extractJson(response);
        try {
            return objectMapper.readValue(json, ResumeSummary.class);
        } catch (IOException e) {
            log.error("AI返回的简历解析结果无法解析: {}", response, e);
            throw new BusinessException("AI简历解析失败，请重试");
        }
    }

    private String loadPromptTemplate() {
        try {
            ClassPathResource resource = new ClassPathResource("prompts/analyze-resume.txt");
            try (InputStream is = resource.getInputStream()) {
                return new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (IOException e) {
            log.error("无法加载Prompt模板", e);
            throw new BusinessException("Prompt模板加载失败");
        }
    }

    private String extractJson(String text) {
        int start = text.indexOf("{");
        int end = text.lastIndexOf("}");
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return text;
    }
}
