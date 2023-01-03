import {V12} from '@/service/V12'
import {OnlineStatus} from "oicq";
import {OneBotStatus} from "@/onebot";
import {getProperties,toLine} from '@/utils'
import {Action} from "./";
export class CommonAction{
    sendMsg(){}
    /**
     * 撤回消息
     * @param message_id {string} 消息id
     */
    deleteMsg(this:V12,message_id:string){
        return this.client.deleteMsg(message_id)
    }
    getSelfInfo(this:V12){
        return {
            user_id:this.client.uin,
            nickname:this.client.nickname,
            user_displayname:''
        }
    }
    getStatus(this:V12){
        return {
            online:this.client.status=OnlineStatus.Online,
            good:this.oneBot.status===OneBotStatus.Good
        }
    }
    getLatestEvents(this:V12,limit:number=0,timout:number=0):Promise<V12.Payload<keyof Action>[]>{
        return new Promise(resolve => {
            if(!this.history.length && timout!==0) {
                return setTimeout(()=>resolve(this.action.getLatestEvents.apply(this,[limit,timout])),timout*1000)
            }
            return resolve(this.history.reverse().filter((_,i)=>limit===0?true:i<limit))
        })
    }
    getVersion(this:V12){
        return {
            impl:'onebots',
            platform:'qq',
            version:'0.0.15',
            onebot_version:'12'
        }
    }
    callLogin(this:V12,func:string,...args:any[]){
        return new Promise(async resolve=>{
            const receiveResult=(event)=>{
                this.client.off('system.login.qrcode',receiveResult)
                this.client.off('system.login.device',receiveResult)
                this.client.off('system.login.slider',receiveResult)
                this.client.off('system.login.error',receiveResult)
                resolve(event)
            }
            this.client.on('system.login.qrcode',receiveResult)
            this.client.on('system.login.device',receiveResult)
            this.client.on('system.login.slider',receiveResult)
            this.client.on('system.login.error',receiveResult)
            this.client.once('system.online',receiveResult)
            try{
                await this.client[func](...args)
            }catch (reason){
                receiveResult(reason)
            }
        })
    }
    async submitSlider(this:V12,ticket:string){
        return this.action.callLogin.apply(this,['submitSlider',ticket])
    }
    async submitSmsCode(this:V12,code:string){
        return this.action.callLogin.apply(this,['submitSmsCode',code])
    }
    sendSmsCode(this:V12){
        return new Promise<any>(resolve=>{
            const receiveResult=(e)=>{
                const callback=(data)=>{
                    this.client.off('internal.verbose',receiveResult)
                    this.client.off('system.login.error',receiveResult)
                    resolve(data)
                }
                if((typeof e==='string' && e.includes('已发送')) || typeof e!=='string'){
                    callback(e)
                }
            }
            this.client.on('internal.verbose',receiveResult)
            this.client.on('system.login.error',receiveResult)
            this.client.sendSmsCode()
        })
    }
    login(this:V12,password?:string){
        return this.action.callLogin.apply(this,['login',password])
    }
    logout(this:V12,keepalive?:boolean){
        return new Promise(async resolve => {
            const receiveResult=(e)=>{
                this.client.off('system.offline',receiveResult)
                resolve(e)
            }
            this.client.on('system.offline',receiveResult)
            await this.client.logout(keepalive)
        })
    }
    getSupportedActions(this:V12){
        return [...new Set(getProperties(this.action))].filter(key=>{
            return key!=='constructor'
        }).map(toLine)
    }
}
