package com.interview.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.interview.entity.Question;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface QuestionMapper extends BaseMapper<Question> {

    @Select("SELECT * FROM questions WHERE position = #{position} AND difficulty = #{difficulty} AND deleted = 0")
    List<Question> selectByPositionAndDifficulty(@Param("position") String position,
                                                  @Param("difficulty") String difficulty);

    @Select("SELECT * FROM questions WHERE position = #{position} AND deleted = 0")
    List<Question> selectByPosition(@Param("position") String position);

    @Select("SELECT * FROM questions WHERE position = #{position} AND deleted = 0 ORDER BY RAND() LIMIT #{limit}")
    List<Question> selectRandomQuestions(@Param("position") String position,
                                         @Param("limit") Integer limit);
}
