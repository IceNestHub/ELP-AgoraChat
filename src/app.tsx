import React, { useContext, useEffect, useRef, useState } from 'react';
import {
	Provider,
	Chat,
	ConversationList,
	ConversationItem,
	ConversationData,
	RootContext,
	useClient,
	MessageEditor,
	MessageList,
	TextMessage,
} from 'chatuim2';
import 'chatuim2/style.css';
import { getApiClient } from './http-client';
import { appKey } from './const';

import { AvatarGenerator } from 'random-avatar-generator';
import { translation } from './local/ru';
import { observer } from 'mobx-react-lite';
const generator = new AvatarGenerator();

interface ChatAppProps {
	token: string;
	user: string;
}

const ChatApp = observer((props: ChatAppProps) => {
	const { user, token } = props;
	const client = useClient();
	const isNavigatedToCsv = useRef<boolean>(false);
	const [activeKey, setActiveKey] = useState<number>();
	const [idToName, setIdToName] = useState<Record<string, string>>({});
	const rootStore = useContext(RootContext).rootStore;
	const cvsStore = rootStore.conversationStore;
	const { conversationList } = rootStore.conversationStore;

	useEffect(() => {
		async function load() {
			try {
				await client.open({
					user,
					agoraToken: token,
				});
				const { messages } = await client.getHistoryMessages({
					targetId: 'admin',
					cursor: -1,
					pageSize: 23,
					chatType: 'singleChat',
					searchDirection: 'up',
				});

				rootStore.conversationStore.addConversation({
					avatarUrl: '',
					name: 'admin',
					lastMessage: messages[0],
					unreadCount: 0,
					chatType: 'singleChat',
					conversationId: 'admin',
				});

				const { data: contactIds } = await client.getContacts();
				const users = await getApiClient<{
					result: {
						_id: string;
						firstName: string;
						secondName: string;
					}[];
				}>({
					url: `/users/get/${contactIds}`,
					method: 'GET',
				});

				const idToName = users.result.reduce<Record<string, string>>((acc, item) => {
					return { ...acc, [item._id]: `${item.firstName} ${item.secondName}` };
				}, {});

				setIdToName(idToName);
			} catch (e) {
				console.log(e);
			}
		}
		load().catch();
	}, [client, user, token, rootStore.conversationStore]);

	useEffect(() => {
		const urlParams = new URLSearchParams(document.location.search);
		const conversationId = urlParams.get('conversationId');
		const index = conversationList.findIndex(conversation => conversation.conversationId === conversationId);
		if (index !== -1 && !isNavigatedToCsv.current) {
			cvsStore.setCurrentCvs(conversationList[index]);
			setActiveKey(index);
			isNavigatedToCsv.current = true;
		}
	}, [conversationList, cvsStore]);

	const handleItemClick = (cvs: ConversationData[0], index: number) => () => {
		setActiveKey(index);
		cvsStore.setCurrentCvs({
			chatType: cvs.chatType,
			conversationId: cvs.conversationId,
			name: idToName[cvs.conversationId] || cvs.conversationId,
			unreadCount: 0,
		});
	};

	const renderMessage = (msg: any) => {
		const currentCvs = rootStore.conversationStore.currentCvs;
		if (msg.type === 'txt' && msg.from) {
			const isNotSystemCvs = currentCvs.name !== 'admin';

			return (
				<TextMessage
					shape="square"
					renderUserProfile={() => null}
					nickName={idToName[msg.from]}
					avatar={<img alt="" style={{ width: 32 }} src={generator.generateRandomAvatar(msg.from)} />}
					customAction={{
						visible: isNotSystemCvs,
						actions: [
							{
								content: 'REPLY',
								onClick: () => {},
							},
							{
								content: 'DELETE',
								onClick: () => {},
							},
							{
								content: 'Modify',
								onClick: () => {},
							},
						],
					}}
					status={msg.status}
					textMessage={msg}
				/>
			);
		}
	};

	return (
		<div className="app-container">
			<ConversationList
				renderItem={(cvs, index) => {
					return (
						<ConversationItem
							key={cvs.conversationId}
							isActive={index === activeKey}
							moreAction={{
								visible: false,
								actions: [],
							}}
							avatar={
								<img
									alt=""
									style={{ width: 45 }}
									src={generator.generateRandomAvatar(cvs.conversationId)}
								/>
							}
							onClick={handleItemClick(cvs, index)}
							data={{ ...cvs, name: idToName[cvs.conversationId] || cvs.conversationId }}
						/>
					);
				}}
			/>
			<Chat
				renderMessageList={() => <MessageList renderMessage={renderMessage} />}
				renderHeader={() => null}
				renderMessageEditor={() => {
					const currentCvs = rootStore.conversationStore.currentCvs;
					if (currentCvs?.name === 'admin') {
						return <div style={{ height: 15 }} />;
					}
					return (
						<MessageEditor
							actions={[
								{
									name: 'TEXTAREA',
									visible: true,
								},
								{
									name: 'EMOJI',
									visible: true,
								},
							]}
						/>
					);
				}}
			/>
		</div>
	);
});

const App = (props: ChatAppProps) => {
	const { user, token } = props;
	const initConfig = {
		userId: user,
		token,
		appKey,
	};
	return (
		<Provider
			initConfig={initConfig}
			local={{
				lng: 'en',
				resources: {
					en: {
						translation,
					},
				},
			}}>
			<ChatApp {...props} />
		</Provider>
	);
};

export default App;
