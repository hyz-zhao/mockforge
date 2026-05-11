package com.interview.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.interview.entity.KnowledgeItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface KnowledgeItemMapper extends BaseMapper<KnowledgeItem> {

    @Select("SELECT * FROM knowledge_base WHERE source_file = #{sourceFile}")
    List<KnowledgeItem> selectBySourceFile(@Param("sourceFile") String sourceFile);

    @Select("SELECT * FROM knowledge_base ORDER BY created_at DESC")
    List<KnowledgeItem> selectAll();

    @Select("SELECT * FROM knowledge_base WHERE category = #{category} ORDER BY created_at DESC")
    List<KnowledgeItem> selectByCategory(@Param("category") String category);

    @Select("SELECT * FROM knowledge_base WHERE difficulty = #{difficulty} ORDER BY created_at DESC")
    List<KnowledgeItem> selectByDifficulty(@Param("difficulty") String difficulty);

    @Select("SELECT * FROM knowledge_base WHERE source_file = #{sourceFile} ORDER BY RAND() LIMIT #{limit}")
    List<KnowledgeItem> selectRandomBySource(@Param("sourceFile") String sourceFile, @Param("limit") int limit);

    @Select("SELECT * FROM knowledge_base ORDER BY RAND() LIMIT #{limit}")
    List<KnowledgeItem> selectRandom(@Param("limit") int limit);

    @Select("SELECT COUNT(*) FROM knowledge_base WHERE source_file = #{sourceFile}")
    int countBySourceFile(@Param("sourceFile") String sourceFile);

    @Select("SELECT DISTINCT source_file FROM knowledge_base ORDER BY source_file")
    List<String> selectDistinctSourceFiles();
}
