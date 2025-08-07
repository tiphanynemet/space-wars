const SETINHA_ESQUERDA = 37;
const SETINHA_DIREITA = 39;
const ESPACO = 32;

const JOGO_LARGURA = 800;
const JOGO_ALTURA = 600;

const JOGADOR_LARGURA = 40;
const JOGADOR_MAX_VELOCIDADE = 600.0;
const TIRO_MAX_VELOCIDADE = 300.0;
const TIRO_COOLDOWN = 0.5;

const INIMIGOS_POR_LINHA = 10;
const INIMIGO_HORIZONTAL_PADDING = 80;
const INIMIGO_VERTICAL_PADDING = 70;
const INIMIGO_VERTICAL_ESPACO = 80;
const INIMIGO_COOLDOWN = 5.0;

const STATUS_JOGO = {
  ultimaVez: Date.now(),
  esquerdaPressionada: false,
  direitaPressionada: false,
  espacoPressionado: false,
  jogadorX: 0,
  jogadorY: 0,
  jogadorCooldown: 0,
  tiros: [],
  inimigos: [],
  inimigoTiros: [],
  perde: false
};

function retasCruzadas(r1, r2) {
  return !(
    r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  );
}

function definirPosicao(el, x, y) {
  el.style.transform = `translate(${x}px, ${y}px)`;
}

function prenderValor(v, min, max) {
  if (v < min) {
    return min;
  } else if (v > max) {
    return max;
  } else {
    return v;
  }
}

function aleatorio(min, max) {
  if (min === undefined) min = 0;
  if (max === undefined) max = 1;
  return min + Math.random() * (max - min);
}

function criarJogador($container) {
  STATUS_JOGO.jogadorX = JOGO_LARGURA / 1000;
  STATUS_JOGO.jogadorY = JOGO_ALTURA - 50;
  const $jogador = document.createElement("img");
  $jogador.src = "img/jogador.png";
  $jogador.className = "jogador";
  $container.appendChild($jogador);
  definirPosicao($jogador, STATUS_JOGO.jogadorX, STATUS_JOGO.jogadorY);
}

function matarJogador($container, jogador) {
  $container.removeChild(jogador);
  STATUS_JOGO.perde = true;
  const audio = new Audio("sons/sfx-lose.ogg");
  audio.play();
}

function atualizarJogador(dt, $container) {
  if (STATUS_JOGO.esquerdaPressionada) {
    STATUS_JOGO.jogadorX -= dt * JOGADOR_MAX_VELOCIDADE;
  }
  if (STATUS_JOGO.direitaPressionada) {
    STATUS_JOGO.jogadorX += dt * JOGADOR_MAX_VELOCIDADE;
  }

  STATUS_JOGO.jogadorX = prenderValor(
    STATUS_JOGO.jogadorX,
    JOGADOR_LARGURA,
    JOGO_LARGURA - JOGADOR_LARGURA
  );

  if (STATUS_JOGO.espacoPressionado && STATUS_JOGO.jogadorCooldown <= 0) {
    criarTiro($container, STATUS_JOGO.jogadorX, STATUS_JOGO.jogadorY);
    STATUS_JOGO.jogadorCooldown = TIRO_COOLDOWN;
  }
  if (STATUS_JOGO.jogadorCooldown > 0) {
    STATUS_JOGO.jogadorCooldown -= dt;
  }

  const jogador = document.querySelector(".jogador");
  definirPosicao(jogador, STATUS_JOGO.jogadorX, STATUS_JOGO.jogadorY);
}

function criarTiro($container, x, y) {
  const $element = document.createElement("img");
  $element.src = "img/tiro-1.png";
  $element.className = "tiro";
  $container.appendChild($element);
  const tiro = { x, y, $element };
  STATUS_JOGO.tiros.push(tiro);
  const audio = new Audio("sons/sfx-laser1.ogg");
  audio.play();
  definirPosicao($element, x, y);
}

function atualizarTiros(dt, $container) {
  const tiros = STATUS_JOGO.tiros;
  for (let i = 0; i < tiros.length; i++) {
    const tiro = tiros[i];
    tiro.y -= dt * TIRO_MAX_VELOCIDADE;
    if (tiro.y < 0) {
      destruirTiro($container, tiro);
    }
    definirPosicao(tiro.$element, tiro.x, tiro.y);
    const r1 = tiro.$element.getBoundingClientRect();
    const inimigos = STATUS_JOGO.inimigos;
    for (let j = 0; j < inimigos.length; j++) {
      const inimigo = inimigos[j];
      if (inimigo.isDead) continue;
      const r2 = inimigo.$element.getBoundingClientRect();
      if (retasCruzadas(r1, r2)) {
       
        // Inimigo foi atingido
        destruirInimigo($container, inimigo);
        destruirTiro($container, tiro);
        break;
      }
    }
  }
  STATUS_JOGO.tiros = STATUS_JOGO.tiros.filter(e => !e.isDead);
}

function destruirTiro($container, tiro) {
  $container.removeChild(tiro.$element);
  tiro.isDead = true;
}

function criarInimigo($container, x, y) {
  const $element = document.createElement("img");
  $element.src = "img/nave-inimiga.png";
  $element.className = "inimigo";
  $container.appendChild($element);
  const inimigo = {
    x,
    y,
    cooldown: aleatorio(0.5, INIMIGO_COOLDOWN),
    $element
  };
  STATUS_JOGO.inimigos.push(inimigo);
  definirPosicao($element, x, y);
}

function atualizarInimigos(dt, $container) {
  const dx = Math.sin(STATUS_JOGO.ultimaVez / 1000.0) * 50;
  const dy = Math.cos(STATUS_JOGO.ultimaVez / 1000.0) * 10;

  const inimigos = STATUS_JOGO.inimigos;
  for (let i = 0; i < inimigos.length; i++) {
    const inimigo = inimigos[i];
    const x = inimigo.x + dx;
    const y = inimigo.y + dy;
    definirPosicao(inimigo.$element, x, y);
    inimigo.cooldown -= dt;
    if (inimigo.cooldown <= 0) {
      inimigoTiro($container, x, y);
      inimigo.cooldown = INIMIGO_COOLDOWN;
    }
  }
  STATUS_JOGO.inimigos = STATUS_JOGO.inimigos.filter(e => !e.isDead);
}

function destruirInimigo($container, inimigo) {
  $container.removeChild(inimigo.$element);
  inimigo.isDead = true;
}

function inimigoTiro($container, x, y) {
  const $element = document.createElement("img");
  $element.src = "img/tiro-2.png";
  $element.className = "inimigo-tiro";
  $container.appendChild($element);
  const tiro = { x, y, $element };
  STATUS_JOGO.inimigoTiros.push(tiro);
  definirPosicao($element, x, y);
}

function atualizarInimigoTiro(dt, $container) {
  const tiros = STATUS_JOGO.inimigoTiros;
  for (let i = 0; i < tiros.length; i++) {
    const tiro = tiros[i];
    tiro.y += dt * TIRO_MAX_VELOCIDADE;
    if (tiro.y > JOGO_ALTURA) {
      destruirTiro($container, tiro);
    }
    definirPosicao(tiro.$element, tiro.x, tiro.y);
    const r1 = tiro.$element.getBoundingClientRect();
    const jogador = document.querySelector(".jogador");
    const r2 = jogador.getBoundingClientRect();
    if (retasCruzadas(r1, r2)) {

      // jogador foi atingido
      matarJogador($container, jogador);
      break;
    }
  }
  STATUS_JOGO.inimigoTiros = STATUS_JOGO.inimigoTiros.filter(e => !e.isDead);
}

function iniciar() {
  const $container = document.querySelector(".jogo");
  criarJogador($container);

  const inimigoSpacing =
    (JOGO_LARGURA - INIMIGO_HORIZONTAL_PADDING * 2) / (INIMIGOS_POR_LINHA - 1);
  for (let j = 0; j < 3; j++) {
    const y = INIMIGO_VERTICAL_PADDING + j * INIMIGO_VERTICAL_ESPACO;
    for (let i = 0; i < INIMIGOS_POR_LINHA; i++) {
      const x = i * inimigoSpacing + INIMIGO_HORIZONTAL_PADDING;
      criarInimigo($container, x, y);
    }
  }
}

function ganhou() {
  return STATUS_JOGO.inimigos.length === 0;
}

function atualizar(e) {
  const currentTime = Date.now();
  const dt = (currentTime - STATUS_JOGO.ultimaVez) / 1000.0;

  if (STATUS_JOGO.perde) {
    document.querySelector(".perdeu").style.display = "block";
    return;
  }

  if (ganhou()) {
    document.querySelector(".venceu").style.display = "block";
    return;
  }

  const $container = document.querySelector(".jogo");
  atualizarJogador(dt, $container);
  atualizarTiros(dt, $container);
  atualizarInimigos(dt, $container);
  atualizarInimigoTiro(dt, $container);

  STATUS_JOGO.ultimaVez = currentTime;
  window.requestAnimationFrame(atualizar);
}

function setaBaixo(e) {
  if (e.keyCode === SETINHA_ESQUERDA) {
    STATUS_JOGO.esquerdaPressionada = true;
  } else if (e.keyCode === SETINHA_DIREITA) {
    STATUS_JOGO.direitaPressionada = true;
  } else if (e.keyCode === ESPACO) {
    STATUS_JOGO.espacoPressionado = true;
  }
}

function setaCima(e) {
  if (e.keyCode === SETINHA_ESQUERDA) {
    STATUS_JOGO.esquerdaPressionada = false;
  } else if (e.keyCode === SETINHA_DIREITA) {
    STATUS_JOGO.direitaPressionada = false;
  } else if (e.keyCode === ESPACO) {
    STATUS_JOGO.espacoPressionado = false;
  }
}

iniciar();
window.addEventListener("keydown", setaBaixo);
window.addEventListener("keyup", setaCima);
window.requestAnimationFrame(atualizar);
