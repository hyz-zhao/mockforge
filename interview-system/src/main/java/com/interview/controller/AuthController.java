package com.interview.controller;

import com.interview.common.Result;
import com.interview.dto.request.LoginReq;
import com.interview.dto.request.RegisterReq;
import com.interview.dto.response.LoginResp;
import com.interview.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public Result<Void> register(@Valid @RequestBody RegisterReq req) {
        authService.register(req);
        return Result.ok();
    }

    @PostMapping("/login")
    public Result<LoginResp> login(@Valid @RequestBody LoginReq req) {
        LoginResp resp = authService.login(req);
        return Result.ok(resp);
    }
}
