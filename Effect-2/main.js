const swup = new Swup()
const PAGE = document.body
gsap.registerPlugin(SplitText, ScrambleTextPlugin)

/* ---------- Linguaggio comune: lo stesso "passo" della transizione a pixel ---------- */
const STEP = "steps(4)"          // easing a scatti, firma di tutto il sito
const REVEAL = 0.55              // il testo parte mentre i pixel si stanno dissolvendo
const TEXTS = '.text-title, .text-body, .text-medium'
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches


/* ---------- Griglia di pixel (si adatta a qualsiasi schermo) ---------- */
const wrapperPixel = document.createElement('div')
wrapperPixel.classList.add('wrapper-pixel')
PAGE.appendChild(wrapperPixel)

function buildPixels() {
    const cols = innerWidth < 700 ? 8 : 12
    const rows = Math.ceil(innerHeight / (innerWidth / cols))
    wrapperPixel.style.gridTemplateColumns = `repeat(${cols}, 1fr)`
    wrapperPixel.style.gridTemplateRows = `repeat(${rows}, 1fr)`
    wrapperPixel.replaceChildren(...Array.from({ length: cols * rows }, () => {
        const square = document.createElement('div')
        square.classList.add('square')
        return square
    }))
}

let resizeTimer
addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(buildPixels, 200)
})

function pixelOut() {
    return gsap.to('.square', {
        autoAlpha: 1,
        duration: 0.35,
        ease: STEP,
        stagger: { amount: 0.7, from: "random" }
    })
}

function pixelIn() {
    return gsap.to('.square', {
        autoAlpha: 0,
        duration: 0.35,
        delay: 0.15,
        ease: STEP,
        stagger: { amount: 0.7, from: "random" }
    })
}


/* ---------- Animazione Nav (una sola volta: la nav è fuori da #swup) ---------- */
function navAnimation() {
    if (reduceMotion()) return

    gsap.utils.toArray(['.naming', '.column', '.column-links']).forEach((group, i) => {
        SplitText.create(group, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit(self) {
                return gsap.fromTo(self.lines,
                    { yPercent: 110 },
                    {
                        yPercent: 0,
                        duration: 0.9,
                        ease: STEP,
                        stagger: 0.05,
                        delay: REVEAL + i * 0.1
                    }
                )
            }
        })
    })
}

/* ---------- Hover sui link: scramble, come i titoli ---------- */
function linkScramble() {
    document.querySelector('nav').addEventListener('mouseover', (e) => {
        const a = e.target.closest('.column a, .column-links a')
        if (!a || a.contains(e.relatedTarget) || reduceMotion()) return

        a.dataset.label ||= a.textContent

        // blocca la larghezza: le lettere casuali non devono spostare le colonne
        if (!a.style.width) {
            gsap.set(a, {
                width: a.getBoundingClientRect().width,
                display: "inline-block",
                verticalAlign: "top",
                whiteSpace: "nowrap"
            })
        }
        gsap.to(a, {
            duration: 0.5,
            ease: STEP,
            overwrite: true,
            scrambleText: { text: a.dataset.label, chars: "lowerCase", speed: 0.5 },
            onComplete: () => gsap.set(a, { clearProps: "width,display,verticalAlign,whiteSpace" })
        })
    })
}


/* ---------- Animazione testi: righe in ordine di lettura + parole che "si accendono" a pixel ---------- */
function titleAnimation(selector, delay = 0) {
    if (!document.querySelector(selector)) return   // pagina senza questo elemento

    SplitText.create(selector, {
        type: "lines, words",
        mask: "lines",
        autoSplit: true,
        linesClass: "split-line",
        onSplit(self) {
            self.masks.forEach((mask) => {
                mask.style.paddingBottom = "0.2em"
                mask.style.marginBottom = "-0.2em"
            })
            gsap.set(selector, { autoAlpha: 1 })   // nascosto da CSS fino a qui: niente flash

            const n = self.lines.length
            return gsap.timeline({ delay })
                // le righe salgono una dopo l'altra, a scatti
                .fromTo(self.lines,
                    { yPercent: 100 },
                    { yPercent: 0, duration: 0.8, ease: STEP, stagger: 0.1 },
                    0
                )
                // le parole lampeggiano in ordine casuale, come i pixel della transizione
                .fromTo(self.words,
                    { autoAlpha: 0 },
                    {
                        autoAlpha: 1,
                        duration: 0.4,
                        ease: "steps(3)",
                        stagger: { amount: n * 0.1 + 0.4, from: "random" }
                    },
                    0
                )
        }
    })
}


/* ---------- Animazione immagine: si costruisce a pixel dall'angolo in alto a sinistra ---------- */
function imgAnimation(delay = 0) {
    const img = document.querySelector('.image')
    if (!img) return   // pagina senza immagine: niente da animare

    const COLS = 24, ROWS = 16

    const wrap = document.createElement('div')
    wrap.classList.add('image-wrap')
    img.before(wrap)
    wrap.append(img)

    // ogni quadratino mostra la sua porzione di immagine
    const mask = document.createElement('div')
    mask.classList.add('image-mask')
    mask.style.setProperty('--img', `url("${img.src}")`)
    mask.innerHTML = Array.from({ length: COLS * ROWS }, (_, i) => {
        const x = (i % COLS) / (COLS - 1) * 100
        const y = Math.floor(i / COLS) / (ROWS - 1) * 100
        return `<i style="background-position:${x}% ${y}%"></i>`
    }).join('')
    wrap.append(mask)

    gsap.set(img, { autoAlpha: 0 })

    gsap.timeline({
        delay,
        onComplete: () => {            // a fine animazione: immagine vera, niente fessure tra i quadratini
            gsap.set(img, { autoAlpha: 1 })
            mask.remove()
        }
    }).fromTo(mask.children,
        { autoAlpha: 0, scale: 0.4 },
        {
            autoAlpha: 1,
            scale: 1,
            duration: 0.3,
            ease: "steps(3)",
            stagger: { grid: [ROWS, COLS], from: 0, amount: 1.8, ease: "power1.in" }   // onda diagonale dall'angolo in alto a sx
        }
    )
}


/* ---------- Cursore (una sola volta, fuori dal context) ---------- */
function cursor() {
    if (matchMedia("(pointer: coarse)").matches) return   // touch: niente cursore

    gsap.set(".cursor", { xPercent: -50, yPercent: -50 })

    let xTo = gsap.quickTo(".cursor", "x", { duration: 0.6, ease: "power3" }),
        yTo = gsap.quickTo(".cursor", "y", { duration: 0.6, ease: "power3" }),
        visible = false

    window.addEventListener("mousemove", e => {
        if (!visible) {
            xTo(e.clientX, e.clientX)
            yTo(e.clientY, e.clientY)
            visible = true
            gsap.to(".cursor", { opacity: 1, duration: 0.3, overwrite: "auto" })
        } else {
            xTo(e.clientX)
            yTo(e.clientY)
        }
    })
}


/* ---------- Clear e dichiarazioni ---------- */
let ctx

function initPage() {
    ctx?.revert()
    ctx = gsap.context(() => {
        if (reduceMotion()) {
            gsap.set(TEXTS, { autoAlpha: 1 })   // niente animazioni, ma i testi si vedono
            return
        }
        titleAnimation('.text-title', REVEAL)
        titleAnimation('.col-3 .text-body', REVEAL)
        titleAnimation('.text-medium', REVEAL + 0.15)
        imgAnimation(REVEAL + 0.3)
    })
}


/* ---------- Avvio ---------- */
buildPixels()
cursor()
linkScramble()
navAnimation()

if (!reduceMotion()) {
    gsap.set('.square', { autoAlpha: 1 })   // al primo caricamento la pagina "emerge" dai pixel
    pixelIn()
}

initPage()
swup.hooks.on('content:replace', initPage)


/* ---------- Transizione di pagina ---------- */
swup.hooks.replace('animation:out:await', async () => {
    if (!reduceMotion()) await pixelOut()
})

swup.hooks.replace('animation:in:await', async () => {
    if (!reduceMotion()) await pixelIn()
})