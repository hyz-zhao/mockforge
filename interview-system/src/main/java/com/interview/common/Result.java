package com.interview.common;

import lombok.Data;

@Data
public class Result<T> {

    private Integer code;
    private String message;
    private T data;

    public Result() {}

    public Result(Integer code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static <T> Result<T> ok(T data) {
        return new Result<>(200, "success", data);
    }

    public static <T> Result<T> ok() {
        return new Result<>(200, "success", null);
    }

    public static Result<Void> fail(String message) {
        return new Result<>(400, message, null);
    }

    public static Result<Void> fail(Integer code, String message) {
        return new Result<>(code, message, null);
    }
}
