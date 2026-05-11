package com.interview.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.entity.Question;
import com.interview.service.CacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class CacheServiceImpl implements CacheService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final long CACHE_TTL_HOURS = 24;

    @Override
    public void cacheQuestions(String key, List<Question> questions) {
        try {
            String json = objectMapper.writeValueAsString(questions);
            redisTemplate.opsForValue().set(key, json, CACHE_TTL_HOURS, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("缓存写入失败: key={}", key, e);
        }
    }

    @Override
    public List<Question> getCachedQuestions(String key) {
        try {
            String json = redisTemplate.opsForValue().get(key);
            if (json == null || json.isEmpty()) {
                return Collections.emptyList();
            }
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("缓存读取失败: key={}", key, e);
            return Collections.emptyList();
        }
    }

    @Override
    public void clearCache(String key) {
        try {
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.warn("缓存删除失败: key={}", key, e);
        }
    }
}
