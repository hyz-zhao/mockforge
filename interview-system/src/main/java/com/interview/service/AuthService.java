package com.interview.service;

import com.interview.dto.request.LoginReq;
import com.interview.dto.request.RegisterReq;
import com.interview.dto.response.LoginResp;

public interface AuthService {

    void register(RegisterReq req);

    LoginResp login(LoginReq req);

    Long getCurrentUserId(String token);
}
