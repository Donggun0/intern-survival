import React, { useState, useEffect } from 'react';
import useGameStore from '../store/gameStore';
import { Phone, PhoneOff, AlertTriangle } from 'lucide-react';

const PhoneOverlay = () => {
    const { activeEvent, clearEvent, addDuty, modifyMental, modifyReputation, startMiniGame, isResting, toggleRest } = useGameStore();

    const [canClick, setCanClick] = useState(false);

    useEffect(() => {
        if (activeEvent) {
            setCanClick(false);
            const timer = setTimeout(() => setCanClick(true), 1000); // 1-second protection

            // Auto-ignore phone calls after 10 seconds
            let ignoreTimer;
            if (activeEvent.type === 'PHONE_CALL' || activeEvent.eventType === 'CALL' || activeEvent.eventType === 'COWORKER_REQUEST') {
                ignoreTimer = setTimeout(() => {
                    handleIgnoreCall();
                }, 10000);
            }

            return () => {
                clearTimeout(timer);
                if (ignoreTimer) clearTimeout(ignoreTimer);
            };
        }
    }, [activeEvent]); // ESLint might warn about handleIgnoreCall, but it's safe here because this effect re-runs on activeEvent change

    if (!activeEvent) return null;

    const handleAcceptCall = () => {
        const { isCollapsed } = useGameStore.getState();
        if (isCollapsed) {
            alert("탈진 상태입니다... 눈앞이 깜깜해서 전화를 받을 수 없습니다! (체력 30까지 회복 필요)");
            return;
        }

        if (activeEvent.type === 'PHONE_CALL' || activeEvent.eventType === 'CALL' || activeEvent.eventType === 'COWORKER_REQUEST') {
            addDuty(activeEvent.duty || activeEvent.dutyObj);
            modifyMental(-3, '업무가 추가되어 스트레스를 받습니다.'); // Small mental drain per accept
            if (activeEvent.eventType === 'COWORKER_REQUEST') {
                modifyReputation(10);
                modifyMental(2, '동기를 도와주어 뿌듯하지만 조금 피곤합니다.');
            }
        }
        clearEvent();
    };

    const handleIgnoreCall = () => {
        // If during CPR, no penalty
        const isCprActive = useGameStore.getState().activeMiniGame?.type?.id === 'CPR' || useGameStore.getState().activeMiniGame?.type === 'CPR';

        if (isCprActive) {
            clearEvent();
            return;
        }

        if (activeEvent.eventType === 'COWORKER_REQUEST') {
            modifyReputation(-5);
            modifyMental(-8, '동기의 부탁을 거절해서 마음이 매우 불편합니다.');
        } else if (activeEvent.type === 'PHONE_CALL' || activeEvent.eventType === 'CALL') {
            modifyReputation(-15);
            modifyMental(-12, '콜을 무시해서 찝찝합니다. 간호사들의 뒷담화가 들리는 것 같습니다.');

            // Still add the duty but mark as missed (optional legacy behavior)
            if (activeEvent.dutyObj) {
                addDuty({ ...activeEvent.dutyObj, missedCall: true });
            }
        }
        if (isResting) {
            const { isCollapsed } = useGameStore.getState();
            if (!isCollapsed) {
                toggleRest(); // Wake up anyway
            }
        }
        clearEvent();
    };

    const handleProfessorSubmit = (isCorrect) => {
        if (isCorrect) {
            modifyReputation(10);
            modifyMental(5, '교수님의 질문에 완벽히 대답했습니다! 칭찬을 받았습니다.');
        } else {
            modifyReputation(-10);
            modifyMental(-20, '교수님께 영혼까지 털렸습니다...');
        }
        clearEvent();
    };

    const handleStartCPR = () => {
        clearEvent();
        startMiniGame({ patient: { name: 'Emergency' }, type: 'CPR' });
    };

    // Render for Professor Round
    if (activeEvent.type === 'PROFESSOR_ROUND' || activeEvent.eventType === 'PROFESSOR_ROUND') {
        const questionData = activeEvent.question || activeEvent.data;
        return (
            <div className="overlay-screen" style={{ color: 'white', opacity: canClick ? 1 : 0.9, transition: 'opacity 0.2s', pointerEvents: 'auto' }}>
                <div className="glass-panel vibrating modal-content-animation" style={{ margin: 'auto 20px', borderRadius: '15px', padding: '20px', backgroundColor: '#fffbeb', border: '2px solid #f59e0b', textAlign: 'center', opacity: canClick ? 1 : 0.7 }}>
                    <img src="professor_angry_1772544949836.png" alt="Angry Professor" style={{ height: '150px', margin: '0 auto 15px' }} />
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#b45309' }}>🔥 교수님 불시 회진! 🔥</h2>
                    <p style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 'bold', color: '#b45309' }}>"어이 인턴! {questionData.q}"</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {questionData.options.map((opt, idx) => (
                            <button
                                key={idx}
                                className="btn btn-outline"
                                style={{ textAlign: 'left', padding: '15px', borderColor: '#d97706', color: '#92400e', cursor: canClick ? 'pointer' : 'default' }}
                                onClick={canClick ? () => handleProfessorSubmit(idx === (questionData.a !== undefined ? questionData.a : questionData.correct)) : null}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Render for CPR
    if (activeEvent.type === 'CPR_CALL' || activeEvent.eventType === 'CPR') {
        return (
            <div className="overlay-screen" style={{ backgroundColor: 'rgba(220, 38, 38, 0.8)', opacity: canClick ? 1 : 0.9, transition: 'opacity 0.2s', pointerEvents: 'auto' }}>
                <div className="glass-panel vibrating modal-content-animation" style={{ margin: 'auto 20px', borderRadius: '15px', padding: '30px', backgroundColor: 'white', textAlign: 'center' }}>
                    <AlertTriangle size={64} color="#ef4444" style={{ margin: '0 auto 20px', animation: 'pulse 1s infinite' }} />
                    <h2 style={{ fontSize: '2rem', marginBottom: '10px', color: '#ef4444', fontWeight: 'bold' }}>CODE BLUE!</h2>
                    <p style={{ fontSize: '1.2rem', marginBottom: '30px', fontWeight: 'bold', color: '#1f2937' }}>병동에서 심정지 환자 발생!! 즉시 뛰어오세요!</p>
                    <button className="btn btn-danger" style={{ width: '100%', padding: '20px', fontSize: '1.5rem', fontWeight: 'bold', cursor: canClick ? 'pointer' : 'default', opacity: canClick ? 1 : 0.7 }} onClick={canClick ? handleStartCPR : null}>
                        달려가기 (CPR 시작)
                    </button>
                </div>
            </div>
        );
    }

    // Render for SOS Result
    if (activeEvent.type === 'SOS_RESULT') {
        return (
            <div className="overlay-screen" style={{ justifyContent: 'center', opacity: canClick ? 1 : 0.9, transition: 'opacity 0.2s', pointerEvents: 'auto' }}>
                <div className="glass-panel modal-content-animation" style={{ margin: '20px', padding: '30px', textAlign: 'center', borderRadius: '15px', backgroundColor: '#f8fafc' }}>
                    <img
                        src={activeEvent.success ? "sos_success_1772545635502.png" : "sos_fail_1772545620686.png"}
                        alt="SOS Result"
                        style={{ height: '180px', margin: '0 auto 15px' }}
                    />
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: activeEvent.success ? 'var(--success)' : 'var(--danger)' }}>
                        {activeEvent.success ? '동기 찬스 성공!' : '동기 찬스 거절됨...'}
                    </h2>
                    <p style={{ fontSize: '1.2rem', marginBottom: '20px', fontWeight: 'bold' }}>{activeEvent.message}</p>
                    <button className="btn btn-primary" onClick={clearEvent} style={{ width: '100%' }}>확인</button>
                </div>
            </div>
        );
    }

    const isCprActive = useGameStore.getState().activeMiniGame?.type?.id === 'CPR' || useGameStore.getState().activeMiniGame?.type === 'CPR';

    // Render for Coworker Request
    if (activeEvent.type === 'COWORKER_REQUEST' || activeEvent.eventType === 'COWORKER_REQUEST') {
        return (
            <div className="overlay-screen" style={{ opacity: canClick ? 1 : 0.9, transition: 'opacity 0.2s', pointerEvents: 'auto' }}>
                <div className="glass-panel modal-content-animation" style={{ margin: 'auto 20px', borderRadius: '20px', padding: '20px', textAlign: 'center', opacity: canClick ? 1 : 0.8 }}>
                    <img src="coworker_crying_1772546833911.png" alt="Coworker" style={{ height: '120px', margin: '0 auto 15px', borderRadius: '50%', objectFit: 'cover' }} />
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#3b82f6' }}>{activeEvent.caller}</h2>
                    <p style={{ fontSize: '1.1rem', marginBottom: '30px', fontWeight: 'bold' }}>"{activeEvent.message}"</p>
                    <div style={{ display: 'flex', width: '100%', gap: '15px' }}>
                        <button className="btn btn-outline" style={{ flex: 1, padding: '15px', color: '#ef4444', borderColor: '#ef4444', cursor: canClick ? 'pointer' : 'default' }} onClick={canClick ? handleIgnoreCall : null}>
                            거절 (평판 -5)
                        </button>
                        <button className="btn btn-primary" style={{ flex: 1, padding: '15px', cursor: (canClick && !isCprActive) ? 'pointer' : 'default' }} onClick={(canClick && !isCprActive) ? handleAcceptCall : (isCprActive ? () => alert("CPR 중에는 도와줄 수 없습니다!") : null)} disabled={isCprActive}>
                            도와주기 (+10 평판)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Render for SOS Menu
    if (activeEvent.type === 'SOS_MENU') {
        const executeSos = (isCoffee) => {
            if (!canClick) return;
            const state = useGameStore.getState();
            if (state.duties.length === 0) {
                clearEvent();
                return;
            }

            const coffeePrice = 4500;
            if (isCoffee && state.wallet < coffeePrice) {
                alert("주머니에 돈이 부족합니다... 커피 한 잔 사달라고 하기 미안하네요. (4,500원 필요)");
                return;
            }

            const abgaDuty = state.duties.find(d => d.type?.id === 'ABGA');
            const targetDutyId = abgaDuty ? abgaDuty.id : state.duties[0].id;

            let success = false;
            let repMod = 0;
            let stmMod = 0;
            let walletMod = 0;
            let msg = '';

            if (isCoffee) {
                if (state.stamina < 15) {
                    alert("체력이 부족해서 커피를 사러 갈 수 없습니다.");
                    return;
                }
                stmMod = -15;
                repMod = 5;
                walletMod = -coffeePrice;
                success = true;
                msg = `내 돈 ${coffeePrice}원을 써서 커피 조공 성공! 동기가 기뻐하며 까다로운 듀티를 해결해 줍니다.`;
            } else {
                repMod = -15;
                success = Math.random() > 0.4;
                msg = success ? "동기: '아 씨 나도 바쁜데... 알았어 내가 하나 할게.'" : "동기: '야 나 지금 CPR방이야 미쳐 끊어!!'";
            }

            state.modifyReputation(repMod);
            if (stmMod) state.modifyStamina(stmMod);
            if (walletMod) state.modifyWallet(walletMod);

            if (success) {
                state.completeDuty(targetDutyId);
            }

            useGameStore.setState({
                activeEvent: {
                    type: 'SOS_RESULT',
                    success,
                    message: msg
                }
            });
        };

        const { wallet } = useGameStore.getState();
        const coffeePrice = 4500;

        return (
            <div className="overlay-screen" style={{ opacity: canClick ? 1 : 0.9, transition: 'opacity 0.2s', pointerEvents: 'auto' }}>
                <div className="glass-panel modal-content-animation" style={{ margin: 'auto 20px', borderRadius: '15px', padding: '20px', backgroundColor: 'white', textAlign: 'center', opacity: canClick ? 1 : 0.8 }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#1f2937' }}>동기에게 부탁하기</h2>
                    <p style={{ marginBottom: '10px', fontSize: '1.1rem', color: '#4b5563' }}>어떤 방식으로 부탁하시겠습니까?</p>
                    <p style={{ marginBottom: '20px', fontSize: '0.9rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>내 주머니 사정: {wallet.toLocaleString()}원</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <button
                            className="btn btn-warning"
                            style={{ padding: '15px', cursor: canClick ? 'pointer' : 'default', opacity: wallet < coffeePrice ? 0.6 : 1 }}
                            onClick={() => executeSos(true)}
                        >
                            ☕ 커피 조공 찬스 ({coffeePrice.toLocaleString()}원, 체력 -15, 평판 +5)<br />
                            <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{wallet < coffeePrice ? '잔액 부족' : '성공률 100% / ABGA 우선 해결'}</span>
                        </button>
                        <button className="btn btn-danger" style={{ padding: '15px', cursor: canClick ? 'pointer' : 'default' }} onClick={() => executeSos(false)}>
                            🙏 맨입으로 부탁 (평판 -15)<br />
                            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>성공률 60%</span>
                        </button>
                        <button className="btn btn-outline" style={{ padding: '15px', color: '#6b7280', borderColor: '#d1d5db', cursor: canClick ? 'pointer' : 'default' }} onClick={canClick ? clearEvent : null}>
                            취소
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Select image based on caller
    let callerImage = "nurse_calling_1772544962823.png";
    if (activeEvent.caller === "전공의 선생님") {
        callerImage = "resident_doctor_1772546848721.png";
    } else if (activeEvent.caller === "동기") {
        callerImage = "coworker_crying_1772546833911.png";
    }

    return (
        <div className="overlay-screen" style={{ opacity: canClick ? 1 : 0.9, transition: 'opacity 0.2s', pointerEvents: 'auto' }}>
            <div
                className="glass-panel vibrating modal-content-animation"
                style={{
                    marginTop: 'auto', marginBottom: 'auto',
                    marginLeft: '20px', marginRight: '20px',
                    borderRadius: '20px', padding: '20px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    opacity: canClick ? 1 : 0.8
                }}
            >
                <img src={callerImage} alt="Caller" style={{ height: '120px', margin: '0 auto 15px', borderRadius: '50%', objectFit: 'cover' }} />

                <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>{activeEvent.caller || '병동 간호사'}</h2>

                <p style={{ fontSize: '1.1rem', textAlign: 'center', marginBottom: '30px', color: '#ef4444', fontWeight: 'bold' }}>
                    "{activeEvent.message || '빨리 와주세요!'}"
                </p>

                <div style={{ display: 'flex', width: '100%', gap: '15px' }}>
                    <button
                        className="btn btn-danger"
                        style={{ flex: 1, padding: '15px', cursor: canClick ? 'pointer' : 'default' }}
                        onClick={canClick ? handleIgnoreCall : null}
                    >
                        <PhoneOff size={24} /> <br />
                        {isCprActive ? "바쁨! 무시하기" : "무시 (평판 -15)"}
                    </button>

                    <button
                        className="btn btn-success"
                        style={{ flex: 1, padding: '15px', backgroundColor: (canClick && !isCprActive) ? '#10b981' : '#9ca3af', color: 'white', cursor: (canClick && !isCprActive) ? 'pointer' : 'default' }}
                        onClick={(canClick && !isCprActive) ? handleAcceptCall : (isCprActive ? () => alert("CPR 중에는 전화를 받을 수 없습니다!") : null)}
                        disabled={isCprActive}
                    >
                        <Phone size={24} /> <br />
                        {isCprActive ? "(CPR중)" : "받기 (듀티추가)"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PhoneOverlay;
