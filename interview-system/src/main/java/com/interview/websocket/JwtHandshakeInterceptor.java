package com.interview.websocket;

import com.interview.utils.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        try {
            String query = request.getURI().getQuery();
            if (query == null) {
                log.warn("WebSocket握手失败：缺少token参数");
                return false;
            }

            String token = UriComponentsBuilder.newInstance()
                    .query(query)
                    .build()
                    .getQueryParams()
                    .getFirst("token");

            if (token == null || token.isBlank()) {
                log.warn("WebSocket握手失败：token为空");
                return false;
            }

            if (!jwtUtil.validateToken(token)) {
                log.warn("WebSocket握手失败：token无效或已过期");
                return false;
            }

            Long userId = jwtUtil.getUserId(token);
            attributes.put("userId", userId);
            log.info("WebSocket握手成功：userId={}", userId);
            return true;
        } catch (Exception e) {
            log.error("WebSocket握手异常", e);
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
    }
}
