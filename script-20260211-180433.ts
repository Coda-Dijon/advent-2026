interface Challenge {
    day: number;
    title: string;
    htmlContent: string;
    hasSrcFolder: boolean;
}

declare const hljs: any;

const CHALLENGES_DATA: Challenge[] = [];

document.addEventListener('DOMContentLoaded', function(): void {
    setupCalendar();
    setupModal();
    openChallengeIfPassedAsParam();
});

function setupCalendar(): void {
    const calendar = document.getElementById('calendar');
    if (!calendar) return;

    // Attach event listeners to pre-rendered calendar days
    const dayElements = calendar.querySelectorAll('.calendar-day.available');
    dayElements.forEach(dayElement => {
        const day = parseInt(dayElement.getAttribute('data-day') || '0');
        if (day > 0) {
            dayElement.addEventListener('click', () => {
                dayElement.classList.add('flipping');
                setTimeout(() => {
                    dayElement.classList.remove('flipping');
                    openChallenge(day);
                }, 300);
            });
        }
    });
}

function challengeExists(day: number) {
    return CHALLENGES_DATA.find(c => c.day === day) !== undefined;
}

function openChallengeIfPassedAsParam() {
    const params = new URLSearchParams(document.location.search);
    const day = params.get("day");

    if (day) {
        const dayNum = parseInt(day);
        if (dayNum && challengeExists(dayNum)) {
            toggleWorld('upside');
            openChallenge(dayNum);
        }
    }
}

function openChallenge(day: number): void {
    const challenge = CHALLENGES_DATA.find(c => c.day === day);
    if (!challenge) return;

    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');

    if (!modal || !modalTitle || !modalMessage) return;

    modalTitle.textContent = challenge.title || `Chapitre ${day}`;
    modalMessage.innerHTML = challenge.htmlContent;

    if (challenge.hasSrcFolder) {
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = '↓ Télécharger les sources';
        downloadBtn.className = 'download-btn';
        downloadBtn.onclick = () => downloadSrcFolder(challenge.day);
        modalMessage.appendChild(downloadBtn);
    }

    // Highlight code blocks
    if (typeof hljs !== 'undefined') {
        modalMessage.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
        });
    }

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function downloadSrcFolder(day: number): void {
    const dayStr = day.toString().padStart(2, '0');
    const link = document.createElement('a');
    link.href = `challenges/day-${dayStr}/src.zip`;
    link.download = `day-${dayStr}-src.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function isEscape(e: KeyboardEvent) {
    return e.key === 'Escape';
}

function isModalDisplayed(modal: HTMLElement) {
    return modal.style.display === 'block';
}

function setupModal(): void {
    const modal = document.getElementById('modal');
    const closeButton = document.querySelector('.close');

    if (!modal || !closeButton) return;

    closeButton.addEventListener('click', closeModal);

    modal.addEventListener('click', function(e: MouseEvent) {
        if (e.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', function(e: KeyboardEvent) {
        if (isEscape(e)) {
            if(isModalDisplayed(modal)) closeModal();
            else if(worldState !== 'hawkins') toggleWorld('hawkins');
        }
    });
}

function closeModal(): void {
    const modal = document.getElementById('modal');
    if (!modal) return;

    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

const konamiCode: string[] = [
    'ArrowUp', 'ArrowUp',
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'b', 'a'
];

const triggerWorldDistortion = () => {
    document.body.classList.add('world-shift');
    setTimeout(() => {
        document.body.classList.remove('world-shift');
    }, 400);
};

const showTruth = () => {
    let overlay = document.getElementById('truth-overlay');

    if (!overlay) {
        document.body.insertAdjacentHTML('beforeend', `<div id="truth-overlay">CODA DOESN'T LIE.</div>`);
        overlay = document.getElementById('truth-overlay');
    }
    overlay?.classList.add('show');

    setTimeout(() => {
        overlay?.classList.remove('show');
    }, 3000);
};

const revealSecretDay = () => {
    if (document.getElementById('secret-day')) return;

    const calendar = document.querySelector('.calendar-grid');
    if (!calendar) return;

    calendar.insertAdjacentHTML('beforeend', `
        <div id="secret-day" class="calendar-day secret" data-day="truth">
            <div class="day-number">11</div>
            <div class="day-icon">The Truth</div>
        </div>
    `);

    document.getElementById('secret-day')
        ?.addEventListener('click', showTruth);
};

function startAudio(audio: HTMLAudioElement) {
    audio.currentTime = 0;
    audio.volume = 0.7;
    audio.play().catch(() => {
    });
}

function pauseAudio(audio: HTMLAudioElement) {
    audio.pause();
    audio.currentTime = 0;
}

type WorldState = 'hawkins' | 'upside' | 'abyss';
let worldState: WorldState = 'hawkins';

const stateMap: Record<WorldState, { next: WorldState; playAudio?: boolean }> = {
    hawkins: { next: 'upside', playAudio: false },
    upside:  { next: 'abyss',  playAudio: true },
    abyss:   { next: 'hawkins', playAudio: false },
};

const toggleWorld = (forceState?: WorldState) => {
    const upsideCss = document.getElementById('upside-css') as HTMLLinkElement | null;
    const abyssCss = document.getElementById('abyss-css') as HTMLLinkElement | null;
    const audio = document.getElementById('upside-audio') as HTMLAudioElement | null;

    if (!upsideCss || !abyssCss) return;

    triggerWorldDistortion();

    const nextState = forceState ?? stateMap[worldState].next;
    const { playAudio } = stateMap[nextState];

    worldState = nextState;
    upsideCss.disabled = nextState !== 'upside';
    abyssCss.disabled = nextState !== 'abyss';

    if (audio) playAudio ? startAudio(audio) : pauseAudio(audio);

    if(worldState === 'abyss') revealSecretDay();
};

let konamiIndex: number = 0;
document.addEventListener('keydown', (e: KeyboardEvent) => {
    let key: string = e.key;
    switch (key.toLowerCase()) {
        case 'arrowup': key = 'ArrowUp'; break;
        case 'arrowdown': key = 'ArrowDown'; break;
        case 'arrowleft': key = 'ArrowLeft'; break;
        case 'arrowright': key = 'ArrowRight'; break;
        default: key = e.key.toLowerCase();
    }

    if (key !== konamiCode[konamiIndex]) {
        konamiIndex = 0;
    } else {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            toggleWorld();
            konamiIndex = 0;
        }
    }
});