package com.interview.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.interview.entity.KnowledgeFile;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface KnowledgeFileMapper extends BaseMapper<KnowledgeFile> {

    @Select("SELECT file_name FROM knowledge_files ORDER BY created_at DESC")
    List<String> selectAllFileNames();
}
