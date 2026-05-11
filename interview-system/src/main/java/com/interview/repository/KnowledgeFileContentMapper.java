package com.interview.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.interview.entity.KnowledgeFileContent;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface KnowledgeFileContentMapper extends BaseMapper<KnowledgeFileContent> {

    @Select("SELECT file_content FROM knowledge_file_content WHERE file_name = #{fileName}")
    String getContentByFileName(String fileName);
}
