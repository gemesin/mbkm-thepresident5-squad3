# ChiliCare
API Contract atau Dokumentasi API Aplikasi ChiliCare Team Cultivate Studi Independen The PRESIDENT

### 1. Registrasi

### Method
``POST``
### End Point
``auth/registrasi``
### Authorization
Tidak ada
### Parameter
``body, json``
```
fullName: "Cultivate Keren",
email: "cultivate@gmail.com",
password : "Cultivate123"
```
### Validasi 
fullName harus diisi dan tidak boleh kosong <br>
email harus berformat email terdapat '@' dan juga domain seperti 'gmail.com' atau domain yang lain, email harus diisi (tidak boleh kosong) <br>
password harus minimal terdiri dari 8 karakter dan mempunyai 1 simbol,  password harus diisi (tidak boleh kosong)

### Respon
Jika berhasil: 
``Status 201``
```
{
    "status": "success",
    "message": "Berhasil register",
    "data": {
        "id": 3,
        "fullName": "Cultivate",
        "email": "cultivate@gmail.com"
    }
}
```

### 2. Login

### Method
``POST``
### End Point
``auth/login``
### Authorization
``Tidak ada``
### Parameter
```
email: "cultivate@gmail.com",
password : "Cultivate123"
```

### Respon
Jika berhasil: 
``Status 201``
```
{
    "message": "Success",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJjdWx0aXZhdGVAZ21haWwuY29tIiwiaWF0IjoxNjk5NDE4MDI0fQ.wxBmEbLnLRSktj0jlnmf2zJqarFhgxyZoS03two0Yjc"
    }
}
```
