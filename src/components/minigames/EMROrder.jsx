import React, { useState, useEffect } from 'react';
import useGameStore from '../../store/gameStore';

const EMROrderGame = ({ onComplete }) => {
    const { modifyMental } = useGameStore();

    const [scenario, setScenario] = useState({});
    const [orders, setOrders] = useState([]);
    const [selected, setSelected] = useState([]);

    const scenarios = [
        {
            desc: "타이레놀(650mg), 노말샐라인(1L), 세프트리악손(2g) 오더 내주세요.",
            correct: ["Tylenol 650mg", "Normal Saline 1L", "Ceftriaxone 2g"],
            wrong: ["Ibuprofen 400mg", "Normal Saline 100ml", "Cefotaxime 2g", "Aspirin 100mg", "Morphine 5mg", "Epinephrine 1mg", "Potassium Chloride 40mEq", "Atropa Belladonna", "Placebo 10mg"]
        },
        {
            desc: "진통제 원하십니다. 울트라셋 세미정, 삐콤헥살, 뮤코미트 주세요.",
            correct: ["Ultracet Semi Tab", "Beecom Hexal Inj", "Mucomyst 200mg"],
            wrong: ["Tylenol 650mg", "Morphine 5mg", "Fentanyl Patch 25mcg", "Vitamin C 500mg", "Aspirin 100mg", "Amoxicillin 500mg", "Normal Saline 1L", "Dextrose 5% Water"]
        },
        {
            desc: "수면제 달라고 난리입니다. 스틸녹스 10mg 하나 처방해주세요.",
            correct: ["Stilnox 10mg (Zolpidem)"],
            wrong: ["Valium 5mg", "Ativan 1mg", "Haloperidol 5mg", "Tylenol 650mg", "Morphine 5mg", "Propofol 20ml", "Placebo 10mg", "Melatonin 3mg"]
        }
    ];

    useEffect(() => {
        // Pick random scenario
        const randScen = scenarios[Math.floor(Math.random() * scenarios.length)];
        setScenario(randScen);

        // Generate a random list of items
        const mix = [...randScen.correct];

        // Pick 6 random wrong items
        const shuffledWrong = [...randScen.wrong].sort(() => 0.5 - Math.random());
        mix.push(...shuffledWrong.slice(0, 6));

        // Shuffle final array
        mix.sort(() => 0.5 - Math.random());
        setOrders(mix);
    }, []);

    const handleSelect = (item) => {
        if (selected.includes(item)) return;

        if (scenario.correct.includes(item)) {
            const newSelected = [...selected, item];
            setSelected(newSelected);

            if (newSelected.length >= scenario.correct.length) {
                setTimeout(() => onComplete(true), 500);
            }
        } else {
            // Wrong item penalty
            modifyMental(-5, '잘못된 약을 처방할 뻔했습니다! (지도전문의에게 혼남)');
            alert("틀렸습니다! 정신력 -5");
        }
    };

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: 'var(--text-main)' }}>
                정확한 처방 코드를 클릭하세요 ({selected.length}/{scenario.correct?.length || 3})
            </h3>

            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#eff6ff', borderRadius: '5px', fontSize: '0.9rem' }}>
                <strong>처방 지시사항:</strong> <br />
                {scenario.desc}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flex: 1 }}>
                {orders.map((item, idx) => {
                    const isSelected = selected.includes(item);
                    return (
                        <button
                            key={idx}
                            disabled={isSelected}
                            onClick={() => handleSelect(item)}
                            className="btn btn-outline"
                            style={{
                                padding: '10px',
                                fontSize: '0.85rem',
                                backgroundColor: isSelected ? 'var(--success)' : 'white',
                                color: isSelected ? 'white' : 'var(--text-main)',
                                borderColor: isSelected ? 'var(--success)' : '#d1d5db',
                                opacity: isSelected ? 0.8 : 1
                            }}
                        >
                            {item}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default EMROrderGame;
