import React, { useState } from 'react';
import './test-components.css';

interface TestComponentsProps {
  title?: string;
}

export const TestComponents: React.FC<TestComponentsProps> = ({ title = "컴포넌트 테스트" }) => {
  const [clickCount, setClickCount] = useState(0);

  return (
    <div className="container">
      <h1 className="title">{title}</h1>
      
      {/* 도형 섹션 */}
      <h2 className="subtitle">도형 컴포넌트</h2>
      <div className="shape-container">
        <div className="circle">원형</div>
        <div className="rectangle">사각형</div>
        <div className="triangle"></div>
        <div className="diamond">
          <div className="diamond-content">다이아몬드</div>
        </div>
      </div>
      
      <div className="divider"></div>
      
      {/* 텍스트박스 섹션 */}
      <h2 className="subtitle">텍스트박스 컴포넌트</h2>
      <div className="textbox-container">
        <div className="textbox">
          기본 텍스트박스입니다. 일반적인 정보를 표시하는 데 사용됩니다.
        </div>
        <div className="textbox-highlight">
          강조 텍스트박스입니다. 중요한 정보를 강조할 때 사용됩니다.
        </div>
        <div className="textbox-info">
          정보 텍스트박스입니다. 사용자에게 유용한 정보를 제공할 때 사용됩니다.
        </div>
        <div className="textbox-warning">
          경고 텍스트박스입니다. 주의가 필요한 내용을 표시할 때 사용됩니다.
        </div>
        <div className="textbox-success">
          성공 텍스트박스입니다. 작업이 성공적으로 완료되었을 때 사용됩니다.
        </div>
      </div>
      
      <div className="divider"></div>
      
      {/* 버튼 섹션 */}
      <h2 className="subtitle">버튼 컴포넌트</h2>
      <div className="button-container">
        <button 
          className="button button-primary"
          onClick={() => setClickCount(clickCount + 1)}
        >
          Primary 버튼 (클릭: {clickCount})
        </button>
        <button className="button button-success">Success 버튼</button>
        <button className="button button-danger">Danger 버튼</button>
      </div>
      
      <div className="divider"></div>
      
      {/* 카드 섹션 */}
      <h2 className="subtitle">카드 컴포넌트</h2>
      <div className="card-container">
        <div className="card">
          <div className="card-title">카드 제목 1</div>
          <div className="card-content">
            이것은 카드 컴포넌트입니다. 다양한 정보를 깔끔하게 표시할 수 있습니다.
          </div>
        </div>
        <div className="card">
          <div className="card-title">카드 제목 2</div>
          <div className="card-content">
            카드는 호버 효과가 있어서 인터랙티브한 느낌을 줍니다.
          </div>
        </div>
        <div className="card">
          <div className="card-title">카드 제목 3</div>
          <div className="card-content">
            여러 개의 카드를 그리드 레이아웃으로 배치할 수 있습니다.
          </div>
        </div>
      </div>
      
      <div className="divider"></div>
      
      {/* 입력 필드 섹션 */}
      <h2 className="subtitle">입력 필드 컴포넌트</h2>
      <div className="input-container">
        <input type="text" className="input-field" placeholder="이름을 입력하세요" />
        <input type="email" className="input-field" placeholder="이메일을 입력하세요" />
        <input type="password" className="input-field" placeholder="비밀번호를 입력하세요" />
      </div>
    </div>
  );
};

export default TestComponents;

