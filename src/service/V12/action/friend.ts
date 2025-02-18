import {V12} from "../index";
import {processMessage, processMusic} from "@/service/V12/action/utils";

export class FriendAction {
    getUserInfo(this: V12, user_id: number) {
        return this.client.getStrangerInfo(user_id)
    }

    getFriendList(this: V12) {
        return this.client.getFriendList()
    }

    /**
     * 发送私聊消息
     * @param user_id {number} 用户id
     * @param message {import('onebots/lib/service/v12').Sendable} 消息
     * @param source {import('onebots/lib/service/v12').SegmentElem<'reply'>} 引用内容
     */
    async sendPrivateMsg(this: V12, user_id: number, message: V12.Sendable,source?:V12.SegmentElem<'reply'>) {
        let {element, quote,music,share} = await processMessage.apply(this.client, [message,source])
        if (!element.length && (!music||!share)) throw new Error('发送消息不受支持')
        if(music||share) {
            const target=this.client.pickFriend(user_id)
            if(music) await target.shareMusic(music.data.type,music.data.id)
            if(share) await target.shareUrl(share.data)
            return {
                message_id:'',
                message
            }
        }
        return await this.client.sendPrivateMsg(user_id, element, quote ? await this.client.getMsg(quote.data.message_id) : undefined)
    }
}
