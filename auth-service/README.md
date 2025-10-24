## Auth Service (Express + JWT)

### Env
Create `.env` at project root:

```
PORT=3000
JWT_SECRET=your_jwt_secret_here_change_me
JWT_EXPIRES_IN=1h
```

### Run

- Dev: `npm run dev`
- Prod: `npm start`

### Endpoints

- POST `/register` body: `{ "email":"a@b.com", "password":"123456", "name":"A" }`
  - 201 → `{ message, token, user }`

- POST `/login` body: `{ "email":"a@b.com", "password":"123456" }`
  - 200 → `{ message, token, user }`

- GET `/me` header: `Authorization: Bearer <token>`
  - 200 → `{ user }`

- POST `/verify-token` body: `{ "token": "<token>" }`
  - 200 → `{ valid: true, payload }` | 401 → `{ valid: false, error }`

- GET `/protected` header: `Authorization: Bearer <token>`
  - 200 → `{ secret, user }`

### Postman
Import `postman/Express JWT Auth.postman_collection.json`.


