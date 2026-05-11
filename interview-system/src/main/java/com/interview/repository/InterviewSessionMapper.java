package com.interview.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.interview.entity.InterviewSession;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface InterviewSessionMapper extends BaseMapper<InterviewSession> {

    @Select("SELECT COUNT(*) FROM interview_sessions WHERE user_id = #{userId} AND deleted = 0 AND DATE(started_at) = CURDATE()")
    Integer countTodayByUserId(@Param("userId") Long userId);

    @Select("SELECT * FROM interview_sessions WHERE user_id = #{userId} AND deleted = 0 ORDER BY started_at DESC")
    List<InterviewSession> selectByUserId(@Param("userId") Long userId);
}
