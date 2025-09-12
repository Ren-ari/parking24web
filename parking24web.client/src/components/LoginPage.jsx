import React, { useState } from 'react';
import './LoginPage.css';

const LoginPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isFormSuccess, setIsFormSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 간단한 로그인 검증 (실제로는 API 호출)
    if (formData.username && formData.password) {
      // 폼 페이드아웃 효과
      const form = document.querySelector('.form');
      if (form) {
        form.style.transition = 'opacity 0.5s ease-out';
        form.style.opacity = '0';
        
        setTimeout(() => {
          setIsFormSuccess(true);
          // 실제 로그인 성공 후 처리
          console.log('로그인 성공:', formData);
          
          // 애니메이션 완료 후 페이지 전환
          setTimeout(() => {
            onLogin(formData);
          }, 1000); // 제목 애니메이션 시간까지 고려
        }, 500);
      }
    } else {
      alert('사용자명과 비밀번호를 입력해주세요.');
    }
  };

  return (
    <div className={`wrapper ${isFormSuccess ? 'form-success' : ''}`}>
      <video 
        className="background-video" 
        autoPlay 
        muted 
        loop 
        playsInline
      >
        <source src="/video/background.mp4" type="video/mp4" />
      </video>
      
      <div className="container">
        <h1>EPSAI</h1>
        
        <form className="form" onSubmit={handleSubmit}>
          <input 
            type="text" 
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleInputChange}
          />
          <input 
            type="password" 
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
          />
          <button type="submit" id="login-button">Login</button>
        </form>
      </div>
      
    </div>
  );
};

export default LoginPage;
