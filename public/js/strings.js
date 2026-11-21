// Every piece of text on the site, per language. Used by the server (to render
// each language's page) and by the browser (status messages and GIF captions).
//
// cap1 / cap2 are the GIF captions. They come from the film's own subtitle
// tracks; where a track has no second line (cap2: null), cap1 stays on screen
// for the whole line.
//
// To add a language: add an entry here with every key from `en`, and it gets
// its own address (/<slug>/), hreflang tags and a place in the language picker.

const en = {
  title: 'WoofMaker: Buzz, Your Girlfriend… WOOF! GIF Maker (Home Alone)',
  description: "Put anyone in Buzz's picture frame from Home Alone. Make your own “Buzz, your girlfriend… WOOF!” GIF free in seconds, right on your phone. No app, no sign-up, your photo stays on your device.",
  ogTitle: 'Buzz, your girlfriend… WOOF! Make yours.',
  ogDescription: "Put anyone in Buzz's picture frame from Home Alone. Free GIF maker that works right on your phone.",
  twDescription: "Put anyone in Buzz's picture frame. Free GIF maker for your phone.",
  ogImageAlt: "Buzz's girlfriend's framed photo from Home Alone, with the caption: Buzz, your girlfriend… WOOF!",
  appDescription: "Make your own Home Alone “Buzz, your girlfriend… WOOF!” GIF by putting any photo in Buzz's picture frame.",
  faqMemeQ: 'What is the Buzz, your girlfriend… WOOF! meme?',
  faqMemeA: "In Home Alone (1990), Kevin snoops through his brother Buzz's room, finds a framed photo of Buzz's girlfriend and says “Buzz, your girlfriend… WOOF!” WoofMaker puts any photo you choose into that picture frame and turns the scene into a GIF.",

  tagline: 'Put anyone in the picture frame.<br>Buzz, your girlfriend… <b>WOOF!</b>',
  demoAria: 'Example: the Home Alone scene with a placeholder face in the picture frame',
  loading: 'Loading the scene…',
  step1: 'Pick a photo', step2: 'Line up the face', step3: 'Share your WOOF',
  selfie: 'Take a selfie', choose: 'Choose a photo',
  privacy: 'Your photo never leaves your phone.',

  back: 'Back', lineUp: 'Line up the face',
  editorAria: 'Drag to move the photo, pinch to zoom',
  zoom: 'Zoom', livePreview: 'Live preview', captions: 'Captions',
  hint: 'Drag to move · pinch to zoom · fit the face in the oval',
  make: 'Make my WOOF!',

  adjust: 'Adjust the photo', yourWoof: 'Your WOOF', resultAlt: 'Your WOOF GIF', progress: 'Progress',
  sendIt: 'Now send it to your Buzz.',
  share: 'Share', save: 'Save GIF', again: 'Make another',
  iosTip: 'iPhone tip: tap Share, then <b>Save Image</b> to keep it in Photos.',

  aboutTitle: 'Make a “Buzz, your girlfriend… WOOF!” GIF',
  aboutBody: "It's the best line in <i>Home Alone</i>: Kevin digs through Buzz's room, finds the framed photo of Buzz's girlfriend, and delivers the verdict. WoofMaker puts <em>anyone</em> in that picture frame: your friend, your sibling, your boss, your dog.",
  howTitle: 'How it works',
  how1: 'Take a selfie or pick any photo from your phone.',
  how2: 'Drag and pinch to fit the face in the frame.',
  how3: 'Tap <b>Make my WOOF!</b>, then share the GIF to Messages, WhatsApp, Instagram or anywhere.',
  questions: 'Questions',
  q1: 'Is it free?', a1: "Yes. It's free, with no app and no sign-up.",
  q2: 'Is my photo uploaded anywhere?',
  a2: 'No. The GIF is made right in your browser. Your photo never leaves your device. The site uses Google Analytics to count visits and how many GIFs get made; it never receives your photo or your GIF.',
  q3: 'How do I save it on iPhone?',
  a3: 'Tap <b>Share</b>, then <b>Save Image</b>. On Android, tap Share or Save GIF.',
  q4: 'What happened to the original woofmaker.com?',
  a4: 'The 2013 original stopped making GIFs when its server went away. This fan-made version brings the holiday tradition back, rebuilt for phones.',

  tribute: 'A fan-made tribute to the original woofmaker.com.',
  legal: 'Home Alone © 20th Century Studios. Not affiliated or endorsed.',
  openSource: 'Open source:',
  woofsCreated: 'Woofs Created', countAria: '{n} Woofs Created',
  language: 'Language',

  statusScene: 'Setting the scene…', statusWrap: 'Wrapping your GIF…',
  statusReady: 'WOOF! Ready to share.',
  statusError: 'Something went wrong making the GIF. Try again?',
  toastScene: 'Could not load the scene. Check your connection and refresh.',
  toastPhoto: "That photo didn't open. Try a different one.",
  toastShare: 'Sharing failed. Use Save instead.',
  unsupported: 'We currently do not support your browser. Check back later.',
  face: ['YOUR', 'FACE', 'HERE'],
  shareText: 'Buzz, your girlfriend… WOOF! 🐶',
  cap1: 'Buzz, your girlfriend...', cap2: 'WOOF!',
};

// Latin American Spanish. The film is "Mi pobre angelito" there.
const es = {
  title: 'WoofMaker: crea tu GIF «Buzz, ¡tu novia! ¡Puf!» (Mi pobre angelito)',
  description: 'Pon a quien quieras en el portarretratos de Buzz de Mi pobre angelito (Home Alone). Crea gratis tu GIF de «Buzz, ¡tu novia! ¡Puf!» en segundos, desde tu teléfono. Sin app, sin registro, y tu foto no sale de tu dispositivo.',
  ogTitle: 'Buzz, ¡tu novia! ¡Puf! Crea el tuyo.',
  ogDescription: 'Pon a quien quieras en el portarretratos de Buzz de Mi pobre angelito. Creador de GIF gratis que funciona en tu teléfono.',
  twDescription: 'Pon a quien quieras en el portarretratos de Buzz. Creador de GIF gratis para tu teléfono.',
  ogImageAlt: 'La foto enmarcada de la novia de Buzz en Mi pobre angelito, con el texto: Buzz, ¡tu novia! ¡Puf!',
  appDescription: 'Crea tu propio GIF de «Buzz, ¡tu novia! ¡Puf!» de Mi pobre angelito poniendo cualquier foto en el portarretratos de Buzz.',
  faqMemeQ: '¿Qué es el meme de «Buzz, ¡tu novia! ¡Puf!»?',
  faqMemeA: 'En Mi pobre angelito (Home Alone, 1990), Kevin revisa el cuarto de su hermano Buzz, encuentra una foto enmarcada de la novia de Buzz y dice «Buzz, ¡tu novia! ¡Puf!». WoofMaker pone la foto que elijas en ese portarretratos y convierte la escena en un GIF.',

  tagline: 'Pon a quien quieras en el portarretratos.<br>Buzz, ¡tu novia! <b>¡PUF!</b>',
  demoAria: 'Ejemplo: la escena de Mi pobre angelito con una cara de muestra en el portarretratos',
  loading: 'Cargando la escena…',
  step1: 'Elige una foto', step2: 'Acomoda la cara', step3: 'Comparte tu WOOF',
  selfie: 'Tomar una selfie', choose: 'Elegir una foto',
  privacy: 'Tu foto nunca sale de tu teléfono.',

  back: 'Atrás', lineUp: 'Acomoda la cara',
  editorAria: 'Arrastra para mover la foto, pellizca para acercar',
  zoom: 'Zoom', livePreview: 'Vista previa', captions: 'Subtítulos',
  hint: 'Arrastra para mover · pellizca para acercar · pon la cara en el óvalo',
  make: '¡Crear mi WOOF!',

  adjust: 'Ajustar la foto', yourWoof: 'Tu WOOF', resultAlt: 'Tu GIF WOOF', progress: 'Progreso',
  sendIt: 'Ahora mándaselo a tu Buzz.',
  share: 'Compartir', save: 'Guardar GIF', again: 'Crear otro',
  iosTip: 'Consejo para iPhone: toca Compartir y luego <b>Guardar imagen</b> para tenerlo en Fotos.',

  aboutTitle: 'Crea un GIF de «Buzz, ¡tu novia! ¡Puf!»',
  aboutBody: 'Es la mejor frase de <i>Mi pobre angelito</i>: Kevin revisa el cuarto de Buzz, encuentra la foto enmarcada de su novia y da su veredicto. WoofMaker pone a <em>quien sea</em> en ese portarretratos: tu amigo, tu hermana, tu jefe, tu perro.',
  howTitle: 'Cómo funciona',
  how1: 'Tómate una selfie o elige cualquier foto de tu teléfono.',
  how2: 'Arrastra y pellizca para acomodar la cara en el marco.',
  how3: 'Toca <b>¡Crear mi WOOF!</b> y comparte el GIF por Mensajes, WhatsApp, Instagram o donde quieras.',
  questions: 'Preguntas',
  q1: '¿Es gratis?', a1: 'Sí. Es gratis, sin app y sin registro.',
  q2: '¿Mi foto se sube a algún lado?',
  a2: 'No. El GIF se crea en tu navegador y tu foto nunca sale de tu dispositivo. El sitio usa Google Analytics para contar las visitas y cuántos GIF se crean; nunca recibe tu foto ni tu GIF.',
  q3: '¿Cómo lo guardo en iPhone?',
  a3: 'Toca <b>Compartir</b> y luego <b>Guardar imagen</b>. En Android, toca Compartir o Guardar GIF.',
  q4: '¿Qué pasó con el woofmaker.com original?',
  a4: 'El original de 2013 dejó de crear GIF cuando su servidor desapareció. Esta versión hecha por fans recupera la tradición navideña, rehecha para teléfonos.',

  tribute: 'Un homenaje hecho por fans al woofmaker.com original.',
  legal: 'Home Alone © 20th Century Studios. Sin afiliación ni respaldo.',
  openSource: 'Código abierto:',
  woofsCreated: 'Woofs creados', countAria: '{n} Woofs creados',
  language: 'Idioma',

  statusScene: 'Preparando la escena…', statusWrap: 'Envolviendo tu GIF…',
  statusReady: '¡WOOF! Listo para compartir.',
  statusError: 'Algo salió mal al crear el GIF. ¿Intentas de nuevo?',
  toastScene: 'No se pudo cargar la escena. Revisa tu conexión y recarga la página.',
  toastPhoto: 'Esa foto no abrió. Prueba con otra.',
  toastShare: 'No se pudo compartir. Usa Guardar.',
  unsupported: 'Tu navegador no es compatible por ahora.',
  face: ['TU', 'CARA', 'AQUÍ'],
  shareText: 'Buzz, ¡tu novia! ¡Puf! 🐶',
  cap1: 'Buzz, ¡tu novia!', cap2: '¡PUF!',
};

// Brazilian Portuguese. The film is "Esqueceram de Mim" there.
const pt = {
  title: 'WoofMaker: crie seu GIF “Buzz, que namorada!” (Esqueceram de Mim)',
  description: 'Coloque quem você quiser no porta-retrato do Buzz de Esqueceram de Mim (Home Alone). Crie grátis seu GIF “Buzz, que namorada!” em segundos, direto do celular. Sem app, sem cadastro, e sua foto não sai do seu aparelho.',
  ogTitle: 'Buzz, que namorada! Faça o seu.',
  ogDescription: 'Coloque quem você quiser no porta-retrato do Buzz de Esqueceram de Mim. Criador de GIF grátis que funciona no celular.',
  twDescription: 'Coloque quem você quiser no porta-retrato do Buzz. Criador de GIF grátis para o celular.',
  ogImageAlt: 'A foto emoldurada da namorada do Buzz em Esqueceram de Mim, com a legenda: Buzz, que namorada!',
  appDescription: 'Crie seu próprio GIF “Buzz, que namorada!” de Esqueceram de Mim colocando qualquer foto no porta-retrato do Buzz.',
  faqMemeQ: 'O que é o meme “Buzz, que namorada!”?',
  faqMemeA: 'Em Esqueceram de Mim (Home Alone, 1990), Kevin mexe no quarto do irmão Buzz, acha uma foto emoldurada da namorada dele e diz “Buzz, que namorada!”. O WoofMaker coloca a foto que você escolher nesse porta-retrato e transforma a cena em um GIF.',

  tagline: 'Coloque quem quiser no porta-retrato.<br><b>Buzz, que namorada!</b>',
  demoAria: 'Exemplo: a cena de Esqueceram de Mim com um rosto de exemplo no porta-retrato',
  loading: 'Carregando a cena…',
  step1: 'Escolha uma foto', step2: 'Ajuste o rosto', step3: 'Compartilhe seu WOOF',
  selfie: 'Tirar uma selfie', choose: 'Escolher uma foto',
  privacy: 'Sua foto nunca sai do seu celular.',

  back: 'Voltar', lineUp: 'Ajuste o rosto',
  editorAria: 'Arraste para mover a foto, use dois dedos para dar zoom',
  zoom: 'Zoom', livePreview: 'Prévia', captions: 'Legendas',
  hint: 'Arraste para mover · use dois dedos para dar zoom · encaixe o rosto no oval',
  make: 'Criar meu WOOF!',

  adjust: 'Ajustar a foto', yourWoof: 'Seu WOOF', resultAlt: 'Seu GIF WOOF', progress: 'Progresso',
  sendIt: 'Agora mande para o seu Buzz.',
  share: 'Compartilhar', save: 'Salvar GIF', again: 'Criar outro',
  iosTip: 'Dica para iPhone: toque em Compartilhar e depois em <b>Salvar Imagem</b> para guardar em Fotos.',

  aboutTitle: 'Crie um GIF “Buzz, que namorada!”',
  aboutBody: 'É a melhor fala de <i>Esqueceram de Mim</i>: Kevin mexe no quarto do Buzz, acha a foto emoldurada da namorada dele e dá o veredito. O WoofMaker coloca <em>qualquer pessoa</em> nesse porta-retrato: seu amigo, sua irmã, seu chefe, seu cachorro.',
  howTitle: 'Como funciona',
  how1: 'Tire uma selfie ou escolha qualquer foto do celular.',
  how2: 'Arraste e use dois dedos para encaixar o rosto na moldura.',
  how3: 'Toque em <b>Criar meu WOOF!</b> e compartilhe o GIF no Mensagens, WhatsApp, Instagram ou onde quiser.',
  questions: 'Perguntas',
  q1: 'É grátis?', a1: 'Sim. É grátis, sem app e sem cadastro.',
  q2: 'Minha foto é enviada para algum lugar?',
  a2: 'Não. O GIF é criado no seu navegador e sua foto nunca sai do seu aparelho. O site usa o Google Analytics para contar as visitas e quantos GIFs são criados; ele nunca recebe sua foto nem seu GIF.',
  q3: 'Como salvo no iPhone?',
  a3: 'Toque em <b>Compartilhar</b> e depois em <b>Salvar Imagem</b>. No Android, toque em Compartilhar ou Salvar GIF.',
  q4: 'O que aconteceu com o woofmaker.com original?',
  a4: 'O original de 2013 parou de criar GIFs quando o servidor saiu do ar. Esta versão feita por fãs traz a tradição de fim de ano de volta, refeita para celulares.',

  tribute: 'Uma homenagem feita por fãs ao woofmaker.com original.',
  legal: 'Home Alone © 20th Century Studios. Sem afiliação nem endosso.',
  openSource: 'Código aberto:',
  woofsCreated: 'Woofs criados', countAria: '{n} Woofs criados',
  language: 'Idioma',

  statusScene: 'Preparando a cena…', statusWrap: 'Embrulhando seu GIF…',
  statusReady: 'WOOF! Pronto para compartilhar.',
  statusError: 'Algo deu errado ao criar o GIF. Tentar de novo?',
  toastScene: 'Não foi possível carregar a cena. Verifique sua conexão e recarregue a página.',
  toastPhoto: 'Essa foto não abriu. Tente outra.',
  toastShare: 'Não deu para compartilhar. Use Salvar.',
  unsupported: 'Seu navegador ainda não é compatível.',
  face: ['SEU', 'ROSTO', 'AQUI'],
  shareText: 'Buzz, que namorada! 🐶',
  cap1: 'Buzz, que namorada!', cap2: null,
};

// Simplified Chinese. The film is 《小鬼当家》.
const zh = {
  title: 'WoofMaker：《小鬼当家》“巴斯的女朋友”GIF 制作器',
  description: '把任何人放进《小鬼当家》（Home Alone）里巴斯的相框。用手机几秒钟免费制作“巴斯的女朋友”GIF。无需下载应用，无需注册，照片不会离开你的设备。',
  ogTitle: '巴斯的女朋友！来做你自己的 GIF。',
  ogDescription: '把任何人放进《小鬼当家》里巴斯的相框。免费 GIF 制作器，手机上就能用。',
  twDescription: '把任何人放进巴斯的相框。手机上的免费 GIF 制作器。',
  ogImageAlt: '《小鬼当家》中巴斯女朋友的相框照片，字幕：巴斯的女朋友',
  appDescription: '把任意照片放进巴斯的相框，制作你自己的《小鬼当家》“巴斯的女朋友”GIF。',
  faqMemeQ: '“巴斯的女朋友”这个梗是什么？',
  faqMemeA: '在《小鬼当家》（Home Alone，1990）中，凯文翻哥哥巴斯的房间，发现了一张巴斯女朋友的相框照片，说了一句“Buzz, your girlfriend… Woof!”。WoofMaker 会把你选的照片放进那个相框，并把这一幕做成 GIF。',

  tagline: '把任何人放进相框。<br><b>巴斯的女朋友！</b>',
  demoAria: '示例：《小鬼当家》的场景，相框里是示例头像',
  loading: '正在加载场景…',
  step1: '选一张照片', step2: '对准脸部', step3: '分享你的 WOOF',
  selfie: '拍张自拍', choose: '选择照片',
  privacy: '照片不会离开你的手机。',

  back: '返回', lineUp: '对准脸部',
  editorAria: '拖动可移动照片，双指可缩放',
  zoom: '缩放', livePreview: '实时预览', captions: '字幕',
  hint: '拖动移动 · 双指缩放 · 把脸放进椭圆里',
  make: '制作我的 WOOF！',

  adjust: '调整照片', yourWoof: '你的 WOOF', resultAlt: '你的 WOOF GIF', progress: '进度',
  sendIt: '现在发给你的“巴斯”吧。',
  share: '分享', save: '保存 GIF', again: '再做一个',
  iosTip: 'iPhone 提示：点“分享”，再点<b>“存储图像”</b>即可保存到“照片”。',

  aboutTitle: '制作“巴斯的女朋友”GIF',
  aboutBody: '这是<i>《小鬼当家》</i>里最经典的一句台词：凯文翻巴斯的房间，发现了他女朋友的相框照片，然后给出了评价。WoofMaker 可以把<em>任何人</em>放进那个相框：朋友、兄弟姐妹、老板，甚至你的狗。',
  howTitle: '使用方法',
  how1: '拍一张自拍，或从手机里选一张照片。',
  how2: '拖动并用双指缩放，把脸对准相框。',
  how3: '点<b>“制作我的 WOOF！”</b>，然后把 GIF 分享到信息、WhatsApp、Instagram 或任何地方。',
  questions: '常见问题',
  q1: '免费吗？', a1: '免费。不用下载应用，也不用注册。',
  q2: '我的照片会被上传吗？',
  a2: '不会。GIF 完全在你的浏览器里生成，照片不会离开你的设备。本站使用 Google Analytics 统计访问量和生成的 GIF 数量，但不会收到你的照片或 GIF。',
  q3: '在 iPhone 上怎么保存？',
  a3: '点<b>“分享”</b>，再点<b>“存储图像”</b>。在 Android 上，点“分享”或“保存 GIF”。',
  q4: '原来的 woofmaker.com 怎么了？',
  a4: '2013 年的原版因为服务器关闭而无法再生成 GIF。这个粉丝制作的版本让这个节日传统回归，并为手机重新打造。',

  tribute: '向原版 woofmaker.com 致敬的粉丝作品。',
  legal: 'Home Alone © 20th Century Studios。与其无关联，亦未获其认可。',
  openSource: '开源：',
  woofsCreated: '个 Woof 已生成', countAria: '已生成 {n} 个 Woof',
  language: '语言',

  statusScene: '正在布置场景…', statusWrap: '正在打包你的 GIF…',
  statusReady: 'WOOF！可以分享了。',
  statusError: '生成 GIF 时出了点问题。再试一次？',
  toastScene: '无法加载场景。请检查网络后刷新页面。',
  toastPhoto: '这张照片打不开。换一张试试。',
  toastShare: '分享失败。请改用“保存 GIF”。',
  unsupported: '暂不支持你的浏览器。',
  face: ['把脸', '放在', '这里'],
  shareText: '巴斯的女朋友！🐶',
  cap1: '巴斯的女朋友', cap2: null,
};

// Traditional Chinese. The film is 《小鬼當家》.
const zhHant = {
  title: 'WoofMaker：《小鬼當家》「巴斯的女朋友」GIF 製作器',
  description: '把任何人放進《小鬼當家》（Home Alone）裡巴斯的相框。用手機幾秒鐘免費製作「巴斯的女朋友」GIF。不用下載 App，不用註冊，照片不會離開你的裝置。',
  ogTitle: '巴斯的女朋友！來做你自己的 GIF。',
  ogDescription: '把任何人放進《小鬼當家》裡巴斯的相框。免費 GIF 製作器，手機上就能用。',
  twDescription: '把任何人放進巴斯的相框。手機上的免費 GIF 製作器。',
  ogImageAlt: '《小鬼當家》中巴斯女朋友的相框照片，字幕：巴斯的女朋友',
  appDescription: '把任意照片放進巴斯的相框，製作你自己的《小鬼當家》「巴斯的女朋友」GIF。',
  faqMemeQ: '「巴斯的女朋友」這個哏是什麼？',
  faqMemeA: '在《小鬼當家》（Home Alone，1990）中，凱文翻哥哥巴斯的房間，發現了一張巴斯女朋友的相框照片，說了一句「Buzz, your girlfriend… Woof!」。WoofMaker 會把你選的照片放進那個相框，並把這一幕做成 GIF。',

  tagline: '把任何人放進相框。<br><b>巴斯的女朋友！</b>',
  demoAria: '範例：《小鬼當家》的場景，相框裡是範例頭像',
  loading: '正在載入場景…',
  step1: '選一張照片', step2: '對準臉部', step3: '分享你的 WOOF',
  selfie: '拍張自拍', choose: '選擇照片',
  privacy: '照片不會離開你的手機。',

  back: '返回', lineUp: '對準臉部',
  editorAria: '拖曳可移動照片，雙指可縮放',
  zoom: '縮放', livePreview: '即時預覽', captions: '字幕',
  hint: '拖曳移動 · 雙指縮放 · 把臉放進橢圓裡',
  make: '製作我的 WOOF！',

  adjust: '調整照片', yourWoof: '你的 WOOF', resultAlt: '你的 WOOF GIF', progress: '進度',
  sendIt: '現在傳給你的「巴斯」吧。',
  share: '分享', save: '儲存 GIF', again: '再做一個',
  iosTip: 'iPhone 提示：點「分享」，再點<b>「儲存影像」</b>即可存到「照片」。',

  aboutTitle: '製作「巴斯的女朋友」GIF',
  aboutBody: '這是<i>《小鬼當家》</i>裡最經典的一句台詞：凱文翻巴斯的房間，發現了他女朋友的相框照片，然後給出了評價。WoofMaker 可以把<em>任何人</em>放進那個相框：朋友、兄弟姊妹、老闆，甚至你的狗。',
  howTitle: '使用方法',
  how1: '拍一張自拍，或從手機裡選一張照片。',
  how2: '拖曳並用雙指縮放，把臉對準相框。',
  how3: '點<b>「製作我的 WOOF！」</b>，然後把 GIF 分享到訊息、WhatsApp、Instagram 或任何地方。',
  questions: '常見問題',
  q1: '免費嗎？', a1: '免費。不用下載 App，也不用註冊。',
  q2: '我的照片會被上傳嗎？',
  a2: '不會。GIF 完全在你的瀏覽器裡產生，照片不會離開你的裝置。本站使用 Google Analytics 統計造訪次數和產生的 GIF 數量，但不會收到你的照片或 GIF。',
  q3: '在 iPhone 上怎麼儲存？',
  a3: '點<b>「分享」</b>，再點<b>「儲存影像」</b>。在 Android 上，點「分享」或「儲存 GIF」。',
  q4: '原本的 woofmaker.com 怎麼了？',
  a4: '2013 年的原版因為伺服器關閉而無法再產生 GIF。這個粉絲製作的版本讓這個節日傳統回歸，並為手機重新打造。',

  tribute: '向原版 woofmaker.com 致敬的粉絲作品。',
  legal: 'Home Alone © 20th Century Studios。與其無關聯，亦未獲其認可。',
  openSource: '開放原始碼：',
  woofsCreated: '個 Woof 已產生', countAria: '已產生 {n} 個 Woof',
  language: '語言',

  statusScene: '正在佈置場景…', statusWrap: '正在包裝你的 GIF…',
  statusReady: 'WOOF！可以分享了。',
  statusError: '產生 GIF 時出了點問題。再試一次？',
  toastScene: '無法載入場景。請檢查網路後重新整理頁面。',
  toastPhoto: '這張照片打不開。換一張試試。',
  toastShare: '分享失敗。請改用「儲存 GIF」。',
  unsupported: '暫不支援你的瀏覽器。',
  face: ['把臉', '放在', '這裡'],
  shareText: '巴斯的女朋友！🐶',
  cap1: '巴斯的女朋友', cap2: null,
};

// Korean. The film is 《나 홀로 집에》.
const ko = {
  title: 'WoofMaker: 나 홀로 집에 “버즈 여자 친구구나, 웩!” GIF 만들기',
  description: '나 홀로 집에(Home Alone)의 버즈 액자에 누구든 넣어 보세요. 휴대폰에서 몇 초 만에 “버즈 여자 친구구나, 웩!” GIF를 무료로 만들 수 있습니다. 앱 설치도, 가입도 필요 없고 사진은 기기 밖으로 나가지 않습니다.',
  ogTitle: '버즈 여자 친구구나, 웩! 나만의 GIF 만들기',
  ogDescription: '나 홀로 집에의 버즈 액자에 누구든 넣어 보세요. 휴대폰에서 바로 쓰는 무료 GIF 메이커.',
  twDescription: '버즈 액자에 누구든 넣어 보세요. 휴대폰용 무료 GIF 메이커.',
  ogImageAlt: '나 홀로 집에 속 버즈 여자 친구의 액자 사진과 자막: 버즈 여자 친구구나, 웩!',
  appDescription: '버즈의 액자에 원하는 사진을 넣어 나 홀로 집에 “버즈 여자 친구구나, 웩!” GIF를 만들어 보세요.',
  faqMemeQ: '“버즈 여자 친구구나, 웩!” 밈이 뭔가요?',
  faqMemeA: '나 홀로 집에(Home Alone, 1990)에서 케빈은 형 버즈의 방을 뒤지다가 버즈 여자 친구의 액자 사진을 발견하고 “버즈 여자 친구구나, 웩!”이라고 말합니다. WoofMaker는 고른 사진을 그 액자에 넣어 이 장면을 GIF로 만들어 줍니다.',

  tagline: '액자에 누구든 넣어 보세요.<br>버즈 여자 친구구나, <b>웩!</b>',
  demoAria: '예시: 액자에 샘플 얼굴이 들어간 나 홀로 집에 장면',
  loading: '장면을 불러오는 중…',
  step1: '사진 고르기', step2: '얼굴 맞추기', step3: 'WOOF 공유하기',
  selfie: '셀카 찍기', choose: '사진 선택',
  privacy: '사진은 휴대폰 밖으로 나가지 않습니다.',

  back: '뒤로', lineUp: '얼굴 맞추기',
  editorAria: '드래그해서 사진을 옮기고, 두 손가락으로 확대·축소하세요',
  zoom: '확대/축소', livePreview: '미리 보기', captions: '자막',
  hint: '드래그로 이동 · 두 손가락으로 확대 · 타원에 얼굴 맞추기',
  make: '내 WOOF 만들기!',

  adjust: '사진 조정', yourWoof: '나의 WOOF', resultAlt: '나의 WOOF GIF', progress: '진행 상황',
  sendIt: '이제 당신의 버즈에게 보내세요.',
  share: '공유', save: 'GIF 저장', again: '하나 더 만들기',
  iosTip: 'iPhone 팁: 공유를 누른 다음 <b>이미지 저장</b>을 누르면 사진 앱에 저장됩니다.',

  aboutTitle: '“버즈 여자 친구구나, 웩!” GIF 만들기',
  aboutBody: '<i>나 홀로 집에</i> 최고의 명대사입니다. 케빈이 버즈의 방을 뒤지다 여자 친구의 액자 사진을 발견하고 한마디 평가를 내리죠. WoofMaker는 그 액자에 <em>누구든</em> 넣어 줍니다. 친구, 형제자매, 상사, 반려견까지요.',
  howTitle: '사용 방법',
  how1: '셀카를 찍거나 휴대폰에서 사진을 고르세요.',
  how2: '드래그하고 두 손가락으로 확대해 얼굴을 액자에 맞추세요.',
  how3: '<b>내 WOOF 만들기!</b>를 누른 다음 메시지, WhatsApp, Instagram 등 어디로든 GIF를 공유하세요.',
  questions: '자주 묻는 질문',
  q1: '무료인가요?', a1: '네. 무료이며 앱 설치나 가입이 필요 없습니다.',
  q2: '제 사진이 어딘가에 업로드되나요?',
  a2: '아니요. GIF는 브라우저 안에서 만들어지며 사진은 기기 밖으로 나가지 않습니다. 이 사이트는 방문 수와 만들어진 GIF 수를 세기 위해 Google Analytics를 사용하지만, 사진이나 GIF는 전송되지 않습니다.',
  q3: 'iPhone에서는 어떻게 저장하나요?',
  a3: '<b>공유</b>를 누른 다음 <b>이미지 저장</b>을 누르세요. Android에서는 공유 또는 GIF 저장을 누르세요.',
  q4: '원래의 woofmaker.com은 어떻게 됐나요?',
  a4: '2013년의 원조 사이트는 서버가 사라지면서 GIF를 만들 수 없게 됐습니다. 팬이 만든 이 버전은 그 연말 전통을 휴대폰에 맞게 다시 살렸습니다.',

  tribute: '원조 woofmaker.com에 바치는 팬 제작 헌정 사이트입니다.',
  legal: 'Home Alone © 20th Century Studios. 제휴 또는 승인 관계가 없습니다.',
  openSource: '오픈 소스:',
  woofsCreated: '개의 Woof 생성됨', countAria: 'Woof {n}개 생성됨',
  language: '언어',

  statusScene: '장면을 준비하는 중…', statusWrap: 'GIF를 포장하는 중…',
  statusReady: 'WOOF! 공유할 준비가 됐어요.',
  statusError: 'GIF를 만드는 중 문제가 생겼어요. 다시 시도할까요?',
  toastScene: '장면을 불러오지 못했어요. 연결을 확인하고 새로 고침해 주세요.',
  toastPhoto: '사진을 열 수 없어요. 다른 사진으로 해 보세요.',
  toastShare: '공유하지 못했어요. 저장을 이용해 주세요.',
  unsupported: '아직 지원하지 않는 브라우저입니다.',
  face: ['얼굴을', '여기에', '넣어요'],
  shareText: '버즈 여자 친구구나, 웩! 🐶',
  cap1: '버즈 여자 친구구나,', cap2: '웩!',
};

// slug: the address (/<slug>/; English lives at /).  htmlLang: <html lang>.
// hreflang: what search engines are told.  name: shown in the language picker.
export const LANGS = {
  en: { htmlLang: 'en', hreflang: 'en', ogLocale: 'en_US', name: 'English', t: en },
  es: { htmlLang: 'es', hreflang: 'es', ogLocale: 'es_419', name: 'Español', t: es },
  pt: { htmlLang: 'pt-BR', hreflang: 'pt', ogLocale: 'pt_BR', name: 'Português', t: pt },
  zh: { htmlLang: 'zh-Hans', hreflang: 'zh-Hans', ogLocale: 'zh_CN', name: '简体中文', t: zh },
  'zh-hant': { htmlLang: 'zh-Hant', hreflang: 'zh-Hant', ogLocale: 'zh_TW', name: '繁體中文', t: zhHant },
  ko: { htmlLang: 'ko', hreflang: 'ko', ogLocale: 'ko_KR', name: '한국어', t: ko },
};

// Text for a language, falling back to English for any missing key.
export function strings(slug) {
  return { ...en, ...(LANGS[slug]?.t || {}) };
}

// Best supported language for a list of browser language tags
// (e.g. ['pt-BR', 'en']). Returns a slug.
export function pickLanguage(tags) {
  for (const raw of tags) {
    const tag = String(raw).toLowerCase();
    const base = tag.split('-')[0];
    if (base === 'zh') return /-(tw|hk|mo|hant)/.test(tag) ? 'zh-hant' : 'zh';
    if (LANGS[base]) return base;
  }
  return 'en';
}
