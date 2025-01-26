// composables/useMessage.ts
export const useMessage = () => {
    // 这里可以添加与后端API的交互逻辑
    const fetchMessages = async (friendId: number) => {
      // 从API获取消息
      //return mockConversations[friendId] || []
    }
  
    const sendMessageToApi = async (friendId: number, content: string) => {
      // 发送消息到API
      console.log('Sending message to API:', { friendId, content })
    }
  
    return {
      fetchMessages,
      sendMessageToApi
    }
  }