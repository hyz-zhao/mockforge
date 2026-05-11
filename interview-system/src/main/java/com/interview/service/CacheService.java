package com.interview.service;

import com.interview.entity.Question;

import java.util.List;

public interface CacheService {

    void cacheQuestions(String key, List<Question> questions);

    List<Question> getCachedQuestions(String key);

    void clearCache(String key);
}
