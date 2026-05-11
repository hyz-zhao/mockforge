package com.interview.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.interview.entity.Resume;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ResumeMapper extends BaseMapper<Resume> {

    @Select("SELECT * FROM resumes WHERE user_id = #{userId} AND deleted = 0 ORDER BY created_at DESC")
    List<Resume> selectByUserId(@Param("userId") Long userId);
}
