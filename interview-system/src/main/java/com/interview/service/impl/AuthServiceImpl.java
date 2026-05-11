package com.interview.service.impl;

import com.interview.common.BusinessException;
import com.interview.dto.request.LoginReq;
import com.interview.dto.request.RegisterReq;
import com.interview.dto.response.LoginResp;
import com.interview.entity.User;
import com.interview.repository.UserMapper;
import com.interview.service.AuthService;
import com.interview.utils.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserMapper userMapper;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public void register(RegisterReq req) {
        User existUser = userMapper.selectByUsername(req.getUsername());
        if (existUser != null) {
            throw new BusinessException("用户名已存在");
        }

        User existEmail = userMapper.selectByEmail(req.getEmail());
        if (existEmail != null) {
            throw new BusinessException("邮箱已被注册");
        }

        User user = new User();
        user.setUsername(req.getUsername());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setEmail(req.getEmail());
        user.setRole(0);
        user.setDeleted(0);
        userMapper.insert(user);
    }

    @Override
    public LoginResp login(LoginReq req) {
        User user = userMapper.selectByUsername(req.getUsername());
        if (user == null) {
            throw new BusinessException("用户名或密码错误");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new BusinessException("用户名或密码错误");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());

        LoginResp resp = new LoginResp();
        resp.setToken(token);
        resp.setUserId(user.getId());
        resp.setUsername(user.getUsername());
        resp.setAvatar(user.getAvatar());
        return resp;
    }

    @Override
    public Long getCurrentUserId(String token) {
        return jwtUtil.getUserId(token);
    }
}
