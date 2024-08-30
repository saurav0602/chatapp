import { useState, useEffect, useRef } from 'react';
import Input from '../../components/input';
import Avatar from '../../assets/avatar.png';
import { io } from 'socket.io-client';

const Dashboard = () => {
    const [user] = useState(JSON.parse(localStorage.getItem('user:detail')));
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState({});
    const [message, setMessage] = useState('');
    const [users, setUsers] = useState([]);
    const [socket, setSocket] = useState(null);
    const messageRef = useRef(null);

    useEffect(() => {
        setSocket(io(`${process.env.REACT_APP_SOCKET_URL}`));
    }, [user?.id]);

    useEffect(() => {
        socket?.emit('addUser', user?.id);
        socket?.on('getUsers', (users) => {
            console.log('activeUsers :>> ', users);
        });
        socket?.on('getMessage', (data) => {
            setMessages((prev) => ({
                ...prev,
                messages: [...prev.messages, { user: data.user, message: data.message }]
            }));
        });
    }, [socket, user?.id]);

    useEffect(() => {
        messageRef?.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages?.messages]);

    useEffect(() => {
        const fetchConversations = async () => {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/conversations/${user?.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const resData = await res.json();
            setConversations(resData);
        };
        fetchConversations();
    }, [user?.id]);

    useEffect(() => {
        const fetchUsers = async () => {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${user?.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const resData = await res.json();
            setUsers(resData);
        };
        fetchUsers();
    }, [user?.id]);

    const fetchMessages = async (conversationId, receiver) => {
        const res = await fetch(
            `${process.env.REACT_APP_API_URL}/api/message/${conversationId}?senderId=${user?.id}&&receiverId=${receiver?.receiverId}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        const resData = await res.json();
        setMessages({ messages: resData, receiver, conversationId });
    };

    const sendMessage = async (e) => {
        setMessage('');
        socket?.emit('sendMessage', {
            senderId: user?.id,
            receiverId: messages?.receiver?.receiverId,
            message,
            conversationId: messages?.conversationId
        });
        await fetch(`${process.env.REACT_APP_API_URL}/api/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversationId: messages?.conversationId,
                senderId: user?.id,
                message,
                receiverId: messages?.receiver?.receiverId
            })
        });
    };

    return (
        <div className="w-screen flex flex-col lg:flex-row">
            {/* Sidebar */}
            <div className="w-full lg:w-[25%] h-[50vh] lg:h-screen bg-secondary overflow-scroll">
                <div className="flex items-center my-8 mx-6 lg:mx-14">
                    <div>
                        <img
                            src={Avatar}
                            width={75}
                            height={75}
                            className="border border-primary p-[2px] rounded-full"
                            alt="User Avatar"
                        />
                    </div>
                    <div className="ml-4 lg:ml-8">
                        <h3 className="text-xl lg:text-2xl">{user?.fullName}</h3>
                        <p className="text-md lg:text-lg font-light">My Account</p>
                    </div>
                </div>
                <hr />
                <div className="mx-6 lg:mx-14 mt-10">
                    <div className="text-primary text-lg">Messages</div>
                    <div>
                        {conversations.length > 0 ? (
                            conversations.map(({ conversationId, user }) => (
                                <div
                                    key={conversationId}
                                    className="flex items-center py-4 lg:py-8 border-b border-b-gray-300"
                                >
                                    <div
                                        className="cursor-pointer flex items-center"
                                        onClick={() => fetchMessages(conversationId, user)}
                                    >
                                        <div>
                                            <img
                                                src={Avatar}
                                                className="w-[50px] h-[50px] lg:w-[60px] lg:h-[60px] rounded-full p-[2px] border border-primary"
                                                alt="User Avatar"
                                            />
                                        </div>
                                        <div className="ml-4 lg:ml-6">
                                            <h3 className="text-md lg:text-lg font-semibold">
                                                {user?.fullName}
                                            </h3>
                                            <p className="text-sm font-light text-gray-600">
                                                {user?.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-lg font-semibold mt-24">
                                No Conversations
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="w-full lg:w-[50%] h-[50vh] lg:h-screen bg-white flex flex-col items-center">
                {messages?.receiver?.fullName && (
                    <div className="w-[90%] lg:w-[75%] bg-secondary h-[80px] my-4 lg:my-14 rounded-full flex items-center px-6 lg:px-14 py-2">
                        <div className="cursor-pointer">
                            <img src={Avatar} width={50} height={50} className="rounded-full" alt="Receiver Avatar" />
                        </div>
                        <div className="ml-4 lg:ml-6 mr-auto">
                            <h3 className="text-md lg:text-lg">{messages?.receiver?.fullName}</h3>
                            <p className="text-sm font-light text-gray-600">
                                {messages?.receiver?.email}
                            </p>
                        </div>
                        <div className="cursor-pointer">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="icon icon-tabler icon-tabler-phone-outgoing"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="black"
                                fill="none"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
                                <line x1="15" y1="9" x2="20" y2="4" />
                                <polyline points="16 4 20 4 20 8" />
                            </svg>
                        </div>
                    </div>
                )}

                <div className="h-[75%] w-full overflow-scroll shadow-sm">
                    <div className="p-4 lg:p-14">
                        {messages?.messages?.length > 0 ? (
                            messages.messages.map(({ message, user: { id } = {} }) => (
                                <div
                                    key={message}
                                    className={`max-w-[80%] lg:max-w-[40%] rounded-b-xl p-4 mb-4 lg:mb-6 ${
                                        id === user?.id
                                            ? 'bg-primary text-white rounded-tl-xl ml-auto'
                                            : 'bg-secondary rounded-tr-xl'
                                    }`}
                                >
                                    {message}
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-lg font-semibold mt-24">
                                No Messages or No Conversation Selected
                            </div>
                        )}
                        <div ref={messageRef}></div>
                    </div>
                </div>

                {messages?.receiver?.fullName && (
                    <div className="p-4 lg:p-14 w-full flex items-center">
                        <Input
                            placeholder="Type a message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-[85%] lg:w-[75%]"
                            inputClassName="p-4 border-0 shadow-md rounded-full bg-light focus:ring-0 focus:border-0 outline-none"
                        />
                        <div
                            className={`ml-2 lg:ml-4 p-2 cursor-pointer bg-light rounded-full ${
                                !message && 'pointer-events-none'
                            }`}
                            onClick={() => sendMessage()}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="icon icon-tabler icon-tabler-send"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="#2c3e50"
                                fill="none"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                                <path d="M21 3l-6.5 18a0.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a0.55 .55 0 0 1 0 -1l18 -6.5" />
                            </svg>
                        </div>
                        <div
                            className={`ml-2 lg:ml-4 p-2 cursor-pointer bg-light rounded-full ${
                                !message && 'pointer-events-none'
                            }`}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="icon icon-tabler icon-tabler-circle-plus"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="#2c3e50"
                                fill="none"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <circle cx="12" cy="12" r="9" />
                                <line x1="9" y1="12" x2="15" y2="12" />
                                <line x1="12" y1="9" x2="12" y2="15" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Sidebar */}
            <div className="w-full lg:w-[25%] h-[50vh] lg:h-screen bg-light px-6 lg:px-8 py-8 lg:py-16 overflow-scroll">
                <div className="text-primary text-lg">People</div>
                <div>
                    {users.length > 0 ? (
                        users.map(({ userId, user }) => (
                            <div
                                key={userId}
                                className="flex items-center py-4 lg:py-8 border-b border-b-gray-300"
                            >
                                <div
                                    className="cursor-pointer flex items-center"
                                    onClick={() => fetchMessages('new', user)}
                                >
                                    <div>
                                        <img
                                            src={Avatar}
                                            className="w-[50px] h-[50px] lg:w-[60px] lg:h-[60px] rounded-full p-[2px] border border-primary"
                                            alt="User Avatar"
                                        />
                                    </div>
                                    <div className="ml-4 lg:ml-6">
                                        <h3 className="text-md lg:text-lg font-semibold">
                                            {user?.fullName}
                                        </h3>
                                        <p className="text-sm font-light text-gray-600">
                                            {user?.email}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-lg font-semibold mt-24">No Conversations</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
