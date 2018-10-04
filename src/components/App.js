import React from 'react';
import ContentEditable from 'react-contenteditable';

import MyScreen from './MyScreen';

import {
  Provider,
  Connected,
  Connecting,
  Disconnected,
  Room,
  RequestUserMedia,
  RequestDisplayMedia,
  RemoteAudioPlayer,
  MediaControls,
  UserControls,
  Video,
  PeerList,
  GridLayout,
  ChatComposers,
  ChatList,
  ChatInput
} from '@andyet/simplewebrtc';

import {
  StyledUIContainer,
  StyledChatContainer,
  StyledChatInputContainer,
  StyledVideoContainer,
  StyledMessageMetadata,
  StyledMessage,
  StyledTimestamp,
  StyledToolbar,
  StyledTyping,
  StyledDisplayName,
  StyledMessageGroup,
  StyledMainContainer,
  StyledChatListContainer
} from './Styles';
import { NONAME } from 'dns';
import { limitPeerVolume } from '@andyet/simplewebrtc/actions';


const App = ({ configUrl, userData, roomName, roomPassword }) => (
  <Provider configUrl={configUrl} userData={userData}>
    {/*
       <RemoteAudioPlayer/> etrafdaki sesi iletir. Gruptaki keşileri susturabilir veya kendi sesimizi susturabiliriz.

       Gruptaki her bir kişinin sesini ayarlamak mümkündür. Varsayılan olarak %80 'den başlar
       See the action `limitPeerVolume(peerAddress, volumeLimit)`.

       Ses çalmak için kullanılan çıkış cihazınıda seçmek mümkündür.
       See the action `setAudioOutputDevice(deviceId)`
    */}
    <RemoteAudioPlayer>
    </RemoteAudioPlayer>

    {/*
      The <Connecting/>, <Connected/>, <Disconnected/>bileşenleri, istemci bağlantı durumuna
       bağlı olarak UI oluşturmanıza izin verir.
       Sadece müşteri ilgili durumda olduğunda kendilerini gösterirler.
    */}

    <Connecting>
      <h1>Bağlanıyor...</h1>
    </Connecting>

    <Disconnected>
      <h1>Bağlantı kaybedildi. Tekrar bağlanılmaya çalışılıyor...</h1>
    </Disconnected>

    <Connected>
      {/*
      Kullanıcı medyası istemek için kullanıyoruz. Ses için  "audio" özelliğini ekliyoruz. 
      Video, "video" özelliğini ekleyerek talep edilebilir.
      
      auto özniteliği herhangi bir UI olmadan hemen medya istemek için kullanılır. Eğer auto sağlanmıyorsa isteği tetiklemek
      için kullanılabilecek bir UI elemanı oluşturulur.
      */}
      <RequestUserMedia audio video auto />

      {/*
        <Room /> compenenti bir media call veya chat içeren bir odaya katılmayı tetikler
    
        name propertisi diğer componentler için kullanılan bir tanımlayıcı değildir. Bunun yerine odanın mesajlaşma adresi kullanılır.

        The `name` property is *not* the identifier used for the room by other components. Instead,
        the room's messaging address is used. That can be found at `room.address`, where `room` is
        one of the properties passed to the child render function. The provided `name` value can later
        be found in `room.providedName`, but be aware that it is an unsanitized value if it can be
        set by a user.

        It is possible to lock rooms, in which case the `password` property must be set in order
        to join. See the actions `lockRoom(roomAddress, password)` and `unlockRoom(roomAddress)`.
      */}
      <Room name={roomName} password={roomPassword}>
        {({ room, peers, localMedia, remoteMedia }) => {
          if (!room.joined) {
            return <h1>Odaya katılınıyor...</h1>;
          }

          const remoteVideos = remoteMedia.filter(m => m.kind === 'video');
          const localVideos = localMedia.filter(m => m.kind === 'video' && m.shared);
          const localScreens = localVideos.filter(m => m.screenCapture);

          return (
            <StyledUIContainer>
              <StyledToolbar>
                <h1>{room.providedName}</h1>
                <div>
                  <span>{peers.length} Peer{peers.length !== 1 ? 's' : ''}</span>
                  <PeerList room={room.address} speaking render={({ peers }) => {
                    if (peers.length === 0) {
                      return null;
                    }
                    return (<span> ({peers.length} speaking)</span>);
                  }} />
                </div>
                <div>
                  {/*
                    <RequestDisplayMedia/> bileşeni, desteklenen tarayıcılarda bir ekran/uygulama seçici tetikleyecektir.
                    Chrome ve Firefox arasındaki davranışlarda bir fark olduğunu unutmayın. Chrome, aynı ekrandan hem monitör ekranlarından
                     hem de uygulama pencerelerinden seçim yapmaya izin verir.
                     Firefox, her iki monitörde de sadece monitör ekranlarından veya uygulama pencerelerinden seçim yapmaya izin verir.

                    The <RequestDisplayMedia/> component will trigger a screen/application selector
                    in supported browsers. Note that there is a difference in behaviour between
                    Chrome and Firefox. Chrome allows picking from both monitor screens and application
                    windows in the same prompt. Firefox only allows picking from either monitor screens
                    or application windows, not both.

                    Screensharing in Chrome requires an extension to be installed.
                  */}
                  {!!!localScreens.length && <RequestDisplayMedia />}

                  {/*
                    <StopSharingLocalMedia /> bileşeni, bir medya parçasının eşler ile paylaşılmasını kaldırır. 
                    Varsayılan olarak medya parçasını da sonlandırmaz, böylece gelecekte tekrar eklenebilir.

                    "AutoRemove" özelliği dahil edilmeyen medya parçası sona erecek.
                  */}
                  {!!localScreens.length && <MediaControls media={localScreens[0]} autoRemove render={({ stopSharing }) => (
                    <button onClick={stopSharing}>Stop Screenshare</button>
                  )} />}
                </div>
                <UserControls render={({ user, isMuted, mute, unmute, setDisplayName }) => (
                  <div>
                    {/* A very basic method for setting a display name */}
                    <ContentEditable
                      className='display-name-editor'
                      html={user.displayName}
                      onChange={(event) => {
                        setDisplayName(event.target.value.trim());
                      }}
                    />
                    <button onClick={() => isMuted ? unmute() : mute()}>{isMuted ? 'Unmute' : 'Mute'}</button>
                  </div>
                )} />
              </StyledToolbar>

              <StyledMainContainer>
                <StyledVideoContainer>

                  <GridLayout 
                    className='videogridme'
                    items={[...localVideos]}
                    renderCell={(item) => (<Video media={item} />)}
                  />

                  <GridLayout
                    className='videogrid'
                    items={[...remoteVideos]}
                    renderCell={(item) => (<Video media={item} />)}
                  />
                </StyledVideoContainer>

                <StyledChatContainer>
                  {/*
                    The <ChatList/> component provides chat messages for the given room, but
                    broken down into groups based on sender. The groups can also be based on
                    time, so that a single group only spans a given duration (e.g., 5 minutes), even
                    if it was the same sender for all of the chats.

                    To control the duration length, set `maxGroupDuration` to the number of seconds
                    that a group can span.

                    By default, the chat list is wrapped in a <StayDownContainer/> which keeps the
                    scrollable area pinned to the bottom as new messages are inserted, unless the
                    user has explicitly scrolled away from the bottom. That behavior can be changed
                    by providing a `render` function property to fully control the rendering instead
                    of using the `renderGroup` property.
                  */}
                  <ChatList
                    room={room.address}
                    className={StyledChatListContainer}
                    renderGroup={({ chats, peer }) => (
                      <StyledMessageGroup key={chats[0].id}>
                        <StyledMessageMetadata>
                          <StyledDisplayName>{peer.displayName ? peer.displayName : 'Anonymous'}</StyledDisplayName>{' '}
                          <StyledTimestamp>{chats[0].time.toLocaleTimeString()}</StyledTimestamp>
                        </StyledMessageMetadata>
                        {/*
                          There is an `acked` property on the message object that can be used
                          to show that a message has been received by the server (e.g. by changing from
                          rendering the body text in gray to black).
                        */}
                        {chats.map(message => (
                          <StyledMessage key={message.id}>{message.body}</StyledMessage>
                        ))}
                      </StyledMessageGroup>
                    )}
                  />
                  <StyledChatInputContainer>
                    {/*
                      The <ChatInput/> component is a basic textarea which will send the composed
                      message to the specified room address when the `Enter` key is pressed.

                      It will also generate and send typing notifications to the room.
                    */}
                    <ChatInput
                      room={room.address}
                      placeholder='Send a message...'
                    />

                    {/*
                      The <ChatComposers/> component simply receives a list of peers actively
                      typing in a given room. How you wish to display that information is up to you
                      with a custom `render` function property.
                    */}
                    <ChatComposers className={StyledTyping} room={room.address} />

                  </StyledChatInputContainer>
                </StyledChatContainer>

              </StyledMainContainer>
            </StyledUIContainer>
          );
        }}
      </Room>
    </Connected>
  </Provider>
);

export default App;
