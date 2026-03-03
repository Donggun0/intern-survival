import React from 'react';
import useGameStore from '../store/gameStore';
import { Stethoscope, AlertCircle } from 'lucide-react';

const DutyList = () => {
    const { duties, startMiniGame } = useGameStore();

    if (duties.length === 0) {
        return <p style={{ color: 'var(--text-muted)' }}>현재 듀티가 없습니다... (곧 콜이 올 겁니다)</p>;
    }

    // Sort duties: urgent first, then older first
    const sortedDuties = [...duties].sort((a, b) => {
        if (a.isUrgent && !b.isUrgent) return -1;
        if (!a.isUrgent && b.isUrgent) return 1;
        return a.createdAt - b.createdAt;
    });

    return (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedDuties.map(duty => (
                <div
                    key={duty.id}
                    className="glass-panel"
                    style={{
                        padding: '15px',
                        borderRadius: '10px',
                        borderLeft: duty.isUrgent ? '5px solid var(--danger)' : '5px solid var(--primary-color)',
                        cursor: 'pointer'
                    }}
                    onClick={() => startMiniGame(duty)}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Stethoscope size={16} /> {duty.type.name}
                        </span>
                        {duty.isUrgent && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}><AlertCircle size={14} /> Urgent</span>}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                        <strong>{duty.patient.location}</strong> {duty.patient.name} ({duty.patient.idNumber})
                    </div>
                    {duty.missedCall && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '5px' }}>
                            * (지연됨) 간호사 컴플레인 누적 중!
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default DutyList;
