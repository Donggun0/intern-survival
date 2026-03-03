import React, { useState } from 'react';
import { PenTool, CheckCircle } from 'lucide-react';

const ConsentFormGame = ({ onComplete }) => {
    const [highlights, setHighlights] = useState([false, false, false]);
    const [signed, setSigned] = useState(false);

    const clauses = [
        "1. 본 시술은 출혈, 감염 등의 합병증이 발생할 수 있습니다.",
        "2. 심각한 경우 사망에 이를 수 있음을 인지하였습니다.",
        "3. 대체 가능한 다른 치료법에 대해 충분히 설명을 들었습니다."
    ];

    const handleHighlight = (index) => {
        const newH = [...highlights];
        newH[index] = true;
        setHighlights(newH);
    };

    const handleSign = () => {
        if (highlights.every(h => h === true)) {
            setSigned(true);
            setTimeout(() => onComplete(true), 1000);
        } else {
            alert("중요 문구에 형광펜을 모두 칠해야 서명을 받을 수 있습니다!");
        }
    };

    return (
        <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '400px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', textAlign: 'center', flexShrink: 0 }}>
                <PenTool style={{ display: 'inline', marginRight: '5px' }} />
                수술/시술 동의서 작성
            </h3>

            <div style={{
                flex: 1, backgroundColor: '#fdfbf7', padding: '15px',
                border: '1px solid #d1d5db', borderRadius: '5px',
                overflowY: 'auto', color: '#374151', fontSize: '0.95rem',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                display: 'flex', flexDirection: 'column'
            }}>
                <h4 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>시술 동의서</h4>
                <p style={{ marginBottom: '15px' }}>환자 본인 혹은 보호자는 아래 설명을 충분히 듣고 이해하였으며, 이에 동의합니다.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px', flex: 1 }}>
                    {clauses.map((text, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleHighlight(idx)}
                            style={{
                                padding: '10px',
                                backgroundColor: highlights[idx] ? '#fef08a' : 'transparent',
                                border: '1px dashed #cbd5e1',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            {text}
                            {!highlights[idx] && <span style={{ float: 'right', fontSize: '0.8rem', color: '#9ca3af' }}>(밑줄 긋기)</span>}
                        </div>
                    ))}
                </div>

                {/* Sticky bottom signing area */}
                <div style={{ borderTop: '2px solid #374151', paddingTop: '15px', marginTop: 'auto', textAlign: 'right' }}>
                    <p style={{ marginBottom: '10px' }}>위 내용을 모두 확인하였음.</p>
                    <div
                        onClick={handleSign}
                        style={{
                            display: 'inline-block', width: '150px', height: '60px',
                            border: '1px solid #9ca3af', backgroundColor: 'white',
                            textAlign: 'center', lineHeight: '60px', color: signed ? 'black' : '#9ca3af',
                            cursor: 'pointer', fontFamily: signed ? 'cursive' : 'inherit'
                        }}
                    >
                        {signed ? '홍길동 (서명)' : '환자 서명 (터치)'}
                    </div>
                </div>
            </div>

            {signed && (
                <div style={{ textAlign: 'center', marginTop: '10px', color: 'var(--success)', fontWeight: 'bold', flexShrink: 0 }}>
                    <CheckCircle style={{ display: 'inline', verticalAlign: 'middle' }} /> 동의서 받기 완료!
                </div>
            )}
        </div>
    );
};

export default ConsentFormGame;
