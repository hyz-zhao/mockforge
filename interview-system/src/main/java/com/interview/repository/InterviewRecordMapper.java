package com.interview.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.interview.entity.InterviewRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface InterviewRecordMapper extends BaseMapper<InterviewRecord> {

    @Select("SELECT * FROM interview_records WHERE session_id = #{sessionId} AND deleted = 0 ORDER BY question_order ASC")
    List<InterviewRecord> selectBySessionId(@Param("sessionId") Long sessionId);

    @Select("SELECT DATE(s.started_at) AS date, " +
            "s.technical_score AS technical, " +
            "s.logic_score AS logic, " +
            "s.expression_score AS expression, " +
            "s.overall_score AS overall " +
            "FROM interview_sessions s " +
            "WHERE s.user_id = #{userId} AND s.deleted = 0 AND s.status = 'completed' " +
            "ORDER BY s.started_at ASC")
    List<Map<String, Object>> selectProgressByUserId(@Param("userId") Long userId);

    @Select("SELECT DATE(s.started_at) AS date, " +
            "AVG(s.technical_score) AS technical, " +
            "AVG(s.logic_score) AS logic, " +
            "AVG(s.expression_score) AS expression, " +
            "AVG(s.overall_score) AS overall " +
            "FROM interview_sessions s " +
            "WHERE s.user_id = #{userId} AND s.deleted = 0 AND s.status = 'completed' " +
            "GROUP BY DATE(s.started_at) " +
            "ORDER BY date ASC")
    List<Map<String, Object>> selectProgressGroupByDate(@Param("userId") Long userId);
}
