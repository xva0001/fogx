# HI here is project introduction

It is a social media platform app with a distributed storage.

## Project structure

(use text editor to watch (or raw on github))

(root dir)
app.config.ts (config for global val )
app.vue         (main view)
assets
|   +-- logo
|       +-- logo.svg
|       +-- logo_dark.svg
components                  (UI components )
|   +-- ActivityChart.vue
|   +-- ActivityTable.vue
|   +-- Comment.vue
|   +-- CreateModal.vue
|   +-- DarkModeBtn.vue
|   +-- DistributionChart.vue
|   +-- ImageBox.vue
|   +-- Post.vue
|   +-- PostContent.vue
|   +-- PostHeader.vue
|   +-- ShareModal.vue
|   +-- Sidebar.vue
|   +-- SideMenu.vue
|   +-- StatCards.vue
|   +-- StoryViewer.vue
composables             (front end function)
|   +-- 2FAObj.ts
|   +-- 2faQRimg.ts
|   +-- FileToBase64.ts
|   +-- formDataToJSObj.ts
|   +-- GoToLogin.ts
|   +-- GoToRegister.ts
|   +-- IMenu.ts
|   +-- Istory.ts
|   +-- logout.ts
|   +-- PasswordAnalyze.ts
|   +-- useMessage.ts
|   +-- useThemeStore.ts
content                           (md file)
|   +-- index.md
|   +-- password_standard.md
content.config.ts                 (md file config)
desktop.ini
middleware                         (frontend middleware )
|   +-- defaultMDW.global.ts
nuxt.config.ts                    (nuxt application config)
package.json
package-lock.json
pages                                    (pages )
|   +-- AccountManagement.vue
|   +-- dashboard
|   |   +-- composables
|   |   |   +-- Idashboard.ts
|   |   |   +-- useDashboardData.ts
|   |   +-- index.vue
|   |   +-- Test.vue
|   +-- Home.vue
|   +-- index.vue
|   +-- index2.vue
|   +-- index3.vue
|   +-- Login.vue
|   +-- Login2FA.vue
|   +-- main.vue
|   +-- passwordStandard.vue
|   +-- post
|   |   +-- [postID].vue
|   +-- PrivateChat.vue
|   +-- register.vue
|   +-- testingOnly
|   |   +-- 2fa.vue
|   |   +-- distribution.vue
|   |   +-- ecdh.vue
|   |   +-- ecdhtesting.vue
|   |   +-- ECDSASign.vue
|   |   +-- ed25519.vue
|   |   +-- index.vue
|   +-- user
|       +-- [userProfile].vue
plugins
|   +-- 2FAValidator.ts
|   +-- browserBackError.ts
|   +-- test_Empty.ts
public
|   +-- fav
|   |   +-- fav.ico
|   +-- favicon.ico
|   +-- robots.txt
README.md
server                                          (backend file )
|   +-- api                                     (api for entry point)
|   |   +-- 2FA
|   |   |   +-- [...].ts                        (catch all /api/2FA)
|   |   |   +-- responeError.ts
|   |   |   +-- vaildator.post.ts
|   |   +-- 2FA.post.ts                        (2FA checking)
|   |   +-- deleteAccount.ts                    (delete account)
|   |   +-- ECDHpubkey.ts                       (get server public key)
|   |   +-- ECDSApubkey.ts                      (get server public key)
|   |   +-- login.ts                            (handle login)
|   |   +-- post
|   |   |   +-- createPost.post.ts              ()
|   |   +-- register
|   |   |   +-- checkNameAvability.ts
|   |   +-- register.ts
|   |   +-- signatureVaildate.ts
|   |   +-- stories
|   |   |   +-- add.post.ts
|   |   |   +-- deleteAll.ts
|   |   |   +-- IStory_resp.ts
|   |   |   +-- remove.ts
|   |   |   +-- secretsStory.post.ts
|   |   |   +-- userRemove.post.ts
|   |   |   +-- userStoriesGet.post.ts
|   |   +-- token
|   |   |   +-- jwt
|   |   |   |   +-- testgen.ts
|   |   |   +-- paseto
|   |   |       +-- patest.ts
|   |   +-- user
|   |   |   +-- confirmNew2FA.post.ts
|   |   |   +-- password.post.ts
|   |   |   +-- profile.post.ts
|   |   |   +-- profileget.post.ts
|   |   |   +-- UserDeleteAccount.post.ts
|   |   |   +-- verifyPasswordAndGenerateKey.post.ts
|   |   +-- validateTurnstile.ts
|   +-- DataFixer                               (input data arr T[] from db -> T)
|   |   +-- findSame.ts
|   |   +-- StoryFixer.ts
|   |   +-- UserInformationFixer.ts
|   +-- db_data_schema                          (db schema)
|   |   +-- IComment.ts
|   |   +-- PostSchema.ts
|   |   +-- StorySchema.ts
|   |   +-- UserSchema.ts
|   +-- dbOperation
|   |   +-- deleteOver24HStory.ts
|   |   +-- deleteStoryWithRollback.ts
|   |   +-- findPublicStory.ts
|   |   +-- findStoryByID.ts
|   |   +-- getUserInfo.ts
|   |   +-- insertStory.ts
|   |   +-- packet-info.ts
|   |   +-- updateUser.ts
|   +-- err
|   |   +-- InvalidErr.ts
|   +-- eventHandle                                 (event handle )
|   |   +-- deleteAccountHandler.ts
|   |   +-- EncrytionHandler
|   |   |   +-- IncomingEncryptionHandler.ts
|   |   +-- EventDispatcher.ts
|   |   +-- LoginHandler.ts
|   |   +-- StoryInsertionHandler.ts
|   |   +-- testHandle.ts
|   |   +-- UpdatePasswordHandler.ts
|   +-- key
|   |   +-- keyGetterForJwt.ts
|   |   +-- keyGetterForPaseto.ts
|   +-- plugins
|   |   +-- dbInit.ts
|   |   +-- test.ts
|   +-- request_sheme
|   |   +-- chat
|   |   |   +-- receiver_req.ts
|   |   |   +-- sender_req.ts
|   |   +-- general
|   |   |   +-- generalTokenSchema.ts
|   |   +-- handleUserInfoUpdate
|   |   |   +-- IPasswordUpdateRequestSchema.ts
|   |   +-- login
|   |   |   +-- ILoginRequest.ts
|   |   +-- post
|   |   |   +-- Ipost.ts
|   |   +-- register
|   |   |   +-- checkName.ts
|   |   |   +-- ICreateAccount.ts
|   |   +-- story
|   |       +-- Istory.ts
|   +-- test.ts
|   +-- token_validator
|   |   +-- ITokenTool.ts
|   |   +-- jwt.ts
|   |   +-- paseto.ts
|   +-- tsconfig.json
|   +-- utils
|       +-- ArrayGroupByIndex.ts                    (原本v1的太慢，v2可接受而已)(沒有goTranspose.ts實現)
|       +-- checkImage.ts
|       +-- cleanObject.ts                          (mongoose 要用lean()，然後用這個清 _開首的attributes)
|       +-- dbconnect.ts
|       +-- decrypt.ts
|       +-- getShareSettings.ts                   (獲取分片設定)
|       +-- goTranspose.ts                          (做不到 rust -> wasm, studying?)(qwq) (沒有也還好，慢也沒所謂?)
|       +-- HashedPost.ts
|       +-- HashedStory.ts
|       +-- HashedUser.ts
|       +-- imageDistrubutionTool.ts                (image 和 長文字 分割)
|       +-- mongodbConn.ts                          (DB conn ???)
|       +-- publicKey.ts
|       +-- SignIUser.ts                            (Sign -> share (分片生成) )
|       +-- SignPost.ts
|       +-- SignStory.ts
|       +-- verifyPacket.ts                         (檢查db 提出來的data 是否被修改)
shared                                                        (front end backend share folder, don't save any private key and information)
|   +-- 2FATool.ts
|   +-- convertMssToSecond.ts
|   +-- Request                                             (Encryption MSG)
|   |   +-- IEncryptReq.ts
|   |   +-- IEncryptRes.ts
|   |   +-- requestEncrytion.ts                             (Encryption MSG class)
|   |   +-- signMessage.ts
|   +-- useKeyFn.ts
tailwind.config.mjs
tsconfig.json


## Current progress

account 的功能完成
-register
-login
-change account info
-delete account

story
-create  (ok)
-delete by user  (欠 frontend )
-沒有 edit
-自動刪 (ok)
-get public story ok
-get private not ok (in new private story page , user input password, backend decrypt -> send data to frontend)

post (在做了)
-create (no)
-edit (no)
-get (no)
-delete (no)

private chat (雙方在線 -> webRTC | 有一方不在，server 暫存，直到對方上線，傳送後刪除)
未開始做

server owner (檢查所有 DATA, FIX DATA, 無效數據刪除，所有資料刪除 )
未做

## reminder

get data -> check data (verify) -> (ok) -> send out
                                 |->(false) -> try to fix (optional, only < thresholds can fix  ) -> (fixed) -> send
                                                                                                  |->(can't fix) error