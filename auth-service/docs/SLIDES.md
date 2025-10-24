## Auth Service (Express + JWT)

### Mục tiêu
- **Đăng ký**: tạo tài khoản, lưu hash mật khẩu, trả JWT.
- **Đăng nhập**: xác thực email/mật khẩu, trả JWT.
- **Xác thực**: bảo vệ endpoint bằng JSON Web Token.

### Kiến trúc thư mục
- `server.js`: khởi tạo Express, middleware, mount routes.
- `src/middleware/auth.js`: middleware `verifyJwt` kiểm tra header `Authorization: Bearer <token>`.
- `src/routes/auth.js`: các route `/register`, `/login`, `/me`, `/verify-token`, `/protected`.
- `src/utils/storage.js`: lưu users dạng file JSON (`data/users.json`).
- `.env`: `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`.
- `postman/Express JWT Auth.postman_collection.json`: collection để test nhanh.

### Flow đăng ký (POST /register)
1. Nhận `{ email, password, name }`.
2. Kiểm tra email trùng.
3. Hash mật khẩu bằng `bcrypt`.
4. Lưu user vào `data/users.json`.
5. Ký JWT: payload `{ id, email }`, `expiresIn=JWT_EXPIRES_IN`.
6. Trả `201 { message, token, user }`.

### Flow đăng nhập (POST /login)
1. Nhận `{ email, password }`.
2. Tìm user theo email, so sánh `bcrypt.compare`.
3. Thành công → ký JWT và trả `{ message, token, user }`.
4. Sai → `401 Invalid email or password`.

### Xác thực JWT
- Client gửi header: `Authorization: Bearer <token>`.
- `verifyJwt` → `jwt.verify(token, JWT_SECRET)`.
- Hợp lệ → `req.user = payload`; sai/hết hạn → `401`.

### Endpoints chính
- `POST /register` → đăng ký, trả JWT.
- `POST /login` → đăng nhập, trả JWT.
- `GET /me` → yêu cầu JWT, trả `req.user` từ token.
- `POST /verify-token` → kiểm tra token hợp lệ.
- `GET /protected` → ví dụ route bảo vệ.

### Mẫu request
```http
POST /login
Content-Type: application/json

{ "email": "user@example.com", "password": "123456" }
```

```http
GET /me
Authorization: Bearer <JWT>
```

### Bảo mật & vận hành
- Dùng `JWT_SECRET` đủ mạnh, không commit lên repo công khai.
- Dùng HTTPS ở môi trường production.
- Thiết lập `JWT_EXPIRES_IN` hợp lý; cân nhắc refresh/rotation khi cần.

### Cách test (Postman)
1) Import collection trong thư mục `postman/`.
2) Gọi `Register` hoặc `Login` → collection tự lưu `{{token}}`.
3) Gọi `Me`/`Protected` với header `Authorization: Bearer {{token}}`.

### Mở rộng tương lai
- Lưu DB (Mongo/Postgres) thay vì file.
- Thêm refresh token, logout, thu hồi token.
- Phân quyền (roles/permissions) và RBAC.

