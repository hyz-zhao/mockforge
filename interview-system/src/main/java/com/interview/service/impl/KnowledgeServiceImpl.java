package com.interview.service.impl;

import com.interview.common.BusinessException;
import com.interview.entity.KnowledgeFile;
import com.interview.entity.KnowledgeFileContent;
import com.interview.entity.KnowledgeItem;
import com.interview.repository.KnowledgeFileContentMapper;
import com.interview.repository.KnowledgeFileMapper;
import com.interview.repository.KnowledgeItemMapper;
import com.interview.service.KnowledgeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeServiceImpl implements KnowledgeService {

    private final KnowledgeItemMapper knowledgeItemMapper;
    private final KnowledgeFileMapper knowledgeFileMapper;
    private final KnowledgeFileContentMapper knowledgeFileContentMapper;

    @Override
    @Transactional
    public int uploadAndParse(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException("文件不能为空");
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || !originalName.toLowerCase().endsWith(".md")) {
            throw new BusinessException("仅支持 .md 格式文件");
        }

        String content;
        try {
            content = new String(file.getBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new BusinessException("文件读取失败");
        }

        List<KnowledgeItem> items = parseMarkdown(content, originalName);

        for (KnowledgeItem item : items) {
            knowledgeItemMapper.insert(item);
        }

        KnowledgeFile kf = new KnowledgeFile();
        kf.setFileName(originalName);
        kf.setFileSize(file.getSize());
        kf.setQuestionCount(items.size());
        knowledgeFileMapper.insert(kf);

        KnowledgeFileContent kfc = new KnowledgeFileContent();
        kfc.setFileName(originalName);
        kfc.setFileContent(content);
        knowledgeFileContentMapper.insert(kfc);

        log.info("知识库文件上传成功: {}, 解析出 {} 道题目", originalName, items.size());
        return items.size();
    }

    @Override
    public List<KnowledgeFile> getAllFiles() {
        return knowledgeFileMapper.selectList(null);
    }

    @Override
    public List<KnowledgeItem> getItemsBySource(String sourceFile) {
        return knowledgeItemMapper.selectBySourceFile(sourceFile);
    }

    @Override
    public List<KnowledgeItem> getItemsByCategory(String category) {
        return knowledgeItemMapper.selectByCategory(category);
    }

    @Override
    public List<KnowledgeItem> getItemsByDifficulty(String difficulty) {
        return knowledgeItemMapper.selectByDifficulty(difficulty);
    }

    @Override
    public List<KnowledgeItem> getRandomItems(int limit) {
        return knowledgeItemMapper.selectRandom(limit);
    }

    @Override
    public List<KnowledgeItem> getRandomItemsBySource(String sourceFile, int limit) {
        return knowledgeItemMapper.selectRandomBySource(sourceFile, limit);
    }

    @Override
    public List<String> getSourceFiles() {
        return knowledgeFileMapper.selectAllFileNames();
    }

    @Override
    public String getFileContent(String fileName) {
        return knowledgeFileContentMapper.getContentByFileName(fileName);
    }

    @Override
    @Transactional
    public void deleteFile(String sourceFile) {
        int count = knowledgeItemMapper.countBySourceFile(sourceFile);
        if (count == 0) {
            throw new BusinessException("文件不存在");
        }
        knowledgeItemMapper.delete(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<KnowledgeItem>()
                        .eq(KnowledgeItem::getSourceFile, sourceFile)
        );
        knowledgeFileMapper.delete(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<KnowledgeFile>()
                        .eq(KnowledgeFile::getFileName, sourceFile)
        );
        knowledgeFileContentMapper.delete(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<KnowledgeFileContent>()
                        .eq(KnowledgeFileContent::getFileName, sourceFile)
        );
    }

    @Override
    @Transactional
    public void deleteItem(Long id) {
        knowledgeItemMapper.deleteById(id);
    }

    private List<KnowledgeItem> parseMarkdown(String content, String sourceFile) {
        List<KnowledgeItem> items = new ArrayList<>();
        String[] lines = content.split("\n");

        StringBuilder currentTitle = new StringBuilder();
        StringBuilder currentContent = new StringBuilder();
        String currentCategory = null;
        String currentDifficulty = null;
        String currentType = null;

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();

            if (line.startsWith("#")) {
                if (currentTitle.length() > 0) {
                    items.add(buildItem(currentTitle.toString(), currentContent.toString(),
                            currentCategory, currentDifficulty, currentType, sourceFile));
                    currentTitle.setLength(0);
                    currentContent.setLength(0);
                    currentCategory = null;
                    currentDifficulty = null;
                    currentType = null;
                }

                String headingText = line.replaceAll("^#+\\s*", "").trim();

                if (line.startsWith("######") || line.startsWith("#####")) {
                    currentDifficulty = parseDifficulty(headingText);
                } else if (line.startsWith("####")) {
                    currentType = parseQuestionType(headingText);
                } else if (line.startsWith("###")) {
                    currentCategory = headingText;
                } else {
                    currentTitle.append(headingText);
                }
            } else if (line.isEmpty()) {
                if (currentContent.length() > 0) {
                    currentContent.append("\n");
                }
            } else {
                if (currentContent.length() > 0) {
                    currentContent.append("\n");
                }
                currentContent.append(line);
            }
        }

        if (currentTitle.length() > 0) {
            items.add(buildItem(currentTitle.toString(), currentContent.toString(),
                    currentCategory, currentDifficulty, currentType, sourceFile));
        }

        return items;
    }

    private KnowledgeItem buildItem(String title, String content, String category,
                                     String difficulty, String questionType, String sourceFile) {
        KnowledgeItem item = new KnowledgeItem();
        item.setFileName(sourceFile);
        item.setTitle(title);
        item.setContent(content);
        item.setCategory(category);
        item.setDifficulty(difficulty);
        item.setQuestionType(questionType);
        item.setSourceFile(sourceFile);
        return item;
    }

    private String parseDifficulty(String text) {
        String lower = text.toLowerCase();
        if (lower.contains("简单") || lower.contains("easy")) return "easy";
        if (lower.contains("困难") || lower.contains("hard")) return "hard";
        if (lower.contains("中等") || lower.contains("medium")) return "medium";
        return null;
    }

    private String parseQuestionType(String text) {
        String lower = text.toLowerCase();
        if (lower.contains("技术") || lower.contains("technical")) return "technical";
        if (lower.contains("行为") || lower.contains("behavioral")) return "behavioral";
        if (lower.contains("场景") || lower.contains("scenario")) return "scenario";
        return null;
    }
}
