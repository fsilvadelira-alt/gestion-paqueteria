import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Package } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al iniciar sesión');
        }
    };

    return (
        <div className="auth-container" style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="login-background"></div>
            <div className="login-overlay"></div>
            <div className="auth-box">
                <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="/logo.png" alt="Logo de la empresa" className="login-logo" />
                    <h1 style={{ fontSize: '1.5rem', textAlign: 'center', color: 'white' }}>Bienvenido a la Plataforma de Gestión</h1>
                    <p style={{ color: 'var(--warning)', fontSize: '0.9rem', textAlign: 'center', marginTop: '5px', marginBottom: '20px' }}>Soluciones Expertas en Mantenimiento Integral</p>
                </div>
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Iniciar Sesión</h2>
                {error && <div style={{ color: 'white', background: 'var(--error)', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Correo Electrónico</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
