import { useState } from 'react';
import Input from '../../components/input';
import Button from '../../components/Button';
import { useNavigate } from 'react-router-dom';

const Form = ({ isSignInPage = true }) => {
    const [data, setData] = useState({
        ...(!isSignInPage && { fullName: '' }),
        email: '',
        password: ''
    });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await fetch(`http://localhost:8000/api/${isSignInPage ? 'login' : 'register'}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (res.status === 400) {
            alert('Invalid credentials');
        } else {
            const resData = await res.json();
            if (resData.token) {
                localStorage.setItem('user:token', resData.token);
                localStorage.setItem('user:detail', JSON.stringify(resData.user));
                navigate('/');
            }
        }
    };

    return (
        <div className="bg-light min-h-screen flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-[600px] h-auto md:h-[800px] shadow-lg rounded-lg flex flex-col justify-center items-center p-8 md:p-14">
                <div className="text-4xl font-extrabold mb-4 md:mb-8">Welcome {isSignInPage && 'Back'}</div>
                <div className="text-xl font-light mb-10 md:mb-14">{isSignInPage ? 'Sign in to get explored' : 'Sign up to get started'}</div>
                <form className="flex flex-col items-center w-full" onSubmit={handleSubmit}>
                    {!isSignInPage && (
                        <Input
                            label="Full name"
                            name="name"
                            placeholder="Enter your full name"
                            className="mb-4 md:mb-6 w-full md:w-[75%]"
                            value={data.fullName}
                            onChange={(e) => setData({ ...data, fullName: e.target.value })}
                        />
                    )}
                    <Input
                        label="Email address"
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        className="mb-4 md:mb-6 w-full md:w-[75%]"
                        value={data.email}
                        onChange={(e) => setData({ ...data, email: e.target.value })}
                    />
                    <Input
                        label="Password"
                        type="password"
                        name="password"
                        placeholder="Enter your Password"
                        className="mb-8 md:mb-14 w-full md:w-[75%]"
                        value={data.password}
                        onChange={(e) => setData({ ...data, password: e.target.value })}
                    />
                    <Button label={isSignInPage ? 'Sign in' : 'Sign up'} type="submit" className="w-full md:w-[75%] mb-2" />
                </form>
                <div className="mt-4">
                    {isSignInPage ? "Didn't have an account?" : 'Already have an account?'}{' '}
                    <span
                        className="text-primary cursor-pointer underline"
                        onClick={() => navigate(`/users/${isSignInPage ? 'sign_up' : 'sign_in'}`)}
                    >
                        {isSignInPage ? 'Sign up' : 'Sign in'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Form;
