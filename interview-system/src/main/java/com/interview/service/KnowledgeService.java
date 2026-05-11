package com.interview.service;

import com.interview.entity.KnowledgeFile;
import com.interview.entity.KnowledgeItem;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface KnowledgeService {

    int uploadAndParse(MultipartFile file);

    List<KnowledgeFile> getAllFiles();

    List<KnowledgeItem> getItemsBySource(String sourceFile);

    List<KnowledgeItem> getItemsByCategory(String category);

    List<KnowledgeItem> getItemsByDifficulty(String difficulty);

    List<KnowledgeItem> getRandomItems(int limit);

    List<KnowledgeItem> getRandomItemsBySource(String sourceFile, int limit);

    List<String> getSourceFiles();

    String getFileContent(String fileName);

    void deleteFile(String sourceFile);

    void deleteItem(Long id);
}
