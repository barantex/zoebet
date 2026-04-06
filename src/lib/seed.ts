import type { Banner, FaqItem, Game, InfoBullet, Match, Promotion, SupportItem } from './types'
import { readJson, writeJson } from './storage'

export const KEYS = {
  auth: 'zoe.auth',
  matches: 'zoe.matches',
  games: 'zoe.games',
  promotions: 'zoe.promotions',
  banners: 'zoe.banners',
  faq: 'zoe.faq',
  support: 'zoe.support.info',
  responsible: 'zoe.responsible',
  privacy: 'zoe.privacy',
  terms: 'zoe.terms',
  supportQuickReplies: 'zoe.support.quickReplies.global',
} as const

const seededFlagKey = 'zoe.seeded.v5'
const CDN = 'https://gator.drakonapi.tech/storage/drakon'

const defaultMatches: Match[] = [
  { id: 'm1', sport: 'Futbol', league: 'Turkiye Super Lig', teams: 'Galatasaray vs Fenerbahce', minute: "23'", score: '1 - 0', odds1: '1.80', oddsX: '3.40', odds2: '4.20', isLive: true },
  { id: 'm2', sport: 'Futbol', league: 'Premier League', teams: 'Liverpool vs Chelsea', minute: "11'", score: '0 - 0', odds1: '2.10', oddsX: '3.20', odds2: '3.10', isLive: true },
  { id: 'm3', sport: 'Basketbol', league: 'EuroLeague', teams: 'Anadolu Efes vs Real Madrid', minute: '2C 07:41', score: '42 - 39', odds1: '1.95', oddsX: '-', odds2: '1.85', isLive: true },
  { id: 'm4', sport: 'Futbol', league: 'La Liga', teams: 'Barcelona vs Real Madrid', minute: "67'", score: '2 - 1', odds1: '1.65', oddsX: '3.80', odds2: '5.20', isLive: true },
  { id: 'm5', sport: 'Tenis', league: 'ATP Masters', teams: 'Djokovic vs Alcaraz', minute: '2. Set', score: '6-4 3-2', odds1: '1.55', oddsX: '-', odds2: '2.40', isLive: true },
]

const defaultGames: Game[] = [
  { id: 's1', name: "Wild Wild Riches Megaways", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Wild-Wild-Riches-Megaways.webp`, code: 'vswayswwriches' },
  { id: 's2', name: "Extra Juicy Megaways", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Extra-Juicy-Megaways.webp`, code: 'vswaysxjuicy' },
  { id: 's3', name: "Yum Yum Powerways", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Yum-Yum-Powerways.webp`, code: 'vswaysyumyum' },
  { id: 's4', name: "Zombie Carnival", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Zombie-Carnival.webp`, code: 'vswayszombcarn' },
  { id: 's5', name: "Fire Hot 100", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Fire-Hot-100.webp`, code: 'vs100firehot' },
  { id: 's6', name: "Jane Hunter Montezuma", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Jane-Hunter-and-the-Mask-of-Montezuma.webp`, code: 'vs10jnmntzma' },
  { id: 's7', name: "Jokers Jewels Hot", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Jokers-Jewels-Hot.webp`, code: 'vs10jokerhot' },
  { id: 's8', name: "Kingdom of the Dead", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Kingdom-of-the-Dead.webp`, code: 'vs10kingofdth' },
  { id: 's9', name: "Lucky Grace and Charm", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Lucky-Grace-and-Charm.webp`, code: 'vs10luckcharm' },
  { id: 's10', name: "Good Luck Good Fortune", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Good-Luck-and-Good-Fortune.webp`, code: 'vs10luckfort' },
  { id: 's11', name: "Madame Destiny", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Madame-Destiny.webp`, code: 'vs10madame' },
  { id: 's12', name: "John Hunter Mayan Gods", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/John-Hunter-And-The-Mayan-Gods.webp`, code: 'vs10mayangods' },
  { id: 's13', name: "Magic Money Maze", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Magic-Money-Maze.webp`, code: 'vs10mmm' },
  { id: 's14', name: "Oodles of Noodles", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Oodles-of-Noodles.webp`, code: 'vs10noodles' },
  { id: 's15', name: "Gates of Aztec", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Gates-of-Aztec.webp`, code: 'vs20aztecgates' },
  { id: 's16', name: "Gates of Olympus", tag: 'Populer', provider: 'slot-pragmatic', imageUrl: `${CDN}/Gates-of-Olympus.webp`, code: 'vs20olympgate' },
  { id: 's17', name: "Sweet Bonanza", tag: 'Populer', provider: 'slot-pragmatic', imageUrl: `${CDN}/Sweet-Bonanza.webp`, code: 'vs20fruitsw' },
  { id: 's18', name: "Starlight Princess", tag: 'Populer', provider: 'slot-pragmatic', imageUrl: `${CDN}/Starlight-Princess.webp`, code: 'vs20starlight' },
  { id: 's19', name: "Big Bass Bonanza", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Big-Bass-Bonanza.webp`, code: 'vs10fishin' },
  { id: 's20', name: "Sugar Rush", tag: 'Populer', provider: 'slot-pragmatic', imageUrl: `${CDN}/Sugar-Rush.webp`, code: 'vs20sugarrush' },
  { id: 's21', name: "Wolf Gold", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Wolf-Gold.webp`, code: 'vs25wolfgold' },
  { id: 's22', name: "Buffalo King", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Buffalo-King.webp`, code: 'vs4096bufking' },
  { id: 's23', name: "The Dog House", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/The-Dog-House.webp`, code: 'vs20doghouse' },
  { id: 's24', name: "Fruit Party", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Fruit-Party.webp`, code: 'vs20fruitparty' },
  { id: 's25', name: "Emerald King", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Emerald-King.webp`, code: 'vs20emeraldking' },
  { id: 's26', name: "Gates of Olympus 1000", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Gates-of-Olympus-1000.webp`, code: 'vs20olympgate1000' },
  { id: 's27', name: "Happy Dragon", tag: 'Slot', provider: 'fat-panda', imageUrl: `${CDN}/Happy-Dragon.webp`, code: 'happydragon' },
  { id: 's28', name: "Haunted Crypt", tag: 'Slot', provider: 'hacksaw', imageUrl: `${CDN}/Haunted-Crypt.webp`, code: 'hauntedcrypt' },
  { id: 's29', name: "Rolling in Treasures", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Rolling-in-Treasures.webp`, code: 'rollingtreasures' },
  { id: 's30', name: "Mummys Jewels 100", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Mummys-Jewels-100.webp`, code: 'mummysjewels100' },
  { id: 's31', name: "Treasure of Osiris", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Treasure-of-Osiris.webp`, code: 'treasureosiris' },
  { id: 's32', name: "Lucky Tiger Gold", tag: 'Slot', provider: 'fat-panda', imageUrl: `${CDN}/Lucky-Tiger-Gold.webp`, code: 'luckytigergold' },
  { id: 's33', name: "Knights Barbarians", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Knights-Barbarians.webp`, code: 'knightsbarbarians' },
  { id: 's34', name: "Fortune Ace", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Fortune-Ace.webp`, code: 'fortuneace' },
  { id: 's35', name: "Ultra Burn Dice", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Ultra-Burn-Dice.webp`, code: 'ultraburndice' },
  { id: 's36', name: "3 Magic Eggs", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/3-Magic-Eggs.webp`, code: '3magiceggs' },
  { id: 's37', name: "Slime Pop", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Slime-Pop.webp`, code: 'slimepop' },
  { id: 's38', name: "Jelly Express", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Jelly-Express.webp`, code: 'jellyexpress' },
  { id: 's39', name: "Triple Pot Diamond", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Triple-Pot-Diamond.webp`, code: 'triplepotdiamond' },
  { id: 's40', name: "Furry Bonanza Megaways", tag: 'Slot', provider: 'slot-pragmatic', imageUrl: `${CDN}/Furry-Bonanza-Megaways.webp`, code: 'furrybonanza' },
  { id: 's41', name: "Aviator", tag: 'Crash', provider: 'spribe', imageUrl: `${CDN}/Aviator.webp`, code: 'aviator' },
  { id: 's42', name: "JetX", tag: 'Crash', provider: 'smartsoft', imageUrl: `${CDN}/JetX.webp`, code: 'jetx' },
  { id: 's43', name: "Spaceman", tag: 'Crash', provider: 'slot-pragmatic', imageUrl: `${CDN}/Spaceman.webp`, code: 'vs20spaceman' },
  { id: 'l1', name: "Turkish Lightning Roulette", tag: 'Live', provider: 'evolutionwcx', imageUrl: `${CDN}/Turkish-Lightning-Roulette.webp`, code: 'game_id:29755' },
  { id: 'l2', name: "Turkish Blackjack 5", tag: 'Live', provider: 'pragmatic-bj', imageUrl: `${CDN}/Turkish-Blackjack-5.webp`, code: 'game_id:24232' },
  { id: 'l3', name: "Turkish Roulette", tag: 'Live', provider: 'ezugi', imageUrl: `${CDN}/Turkish-Roulette.webp`, code: 'game_id:932' },
  { id: 'l4', name: "500x Turkish Roulette", tag: 'Live', provider: '7mojos', imageUrl: `${CDN}/500x-Turkish-Roulette.webp`, code: 'game_id:14869' },
  { id: 'l5', name: "Mega Wheel", tag: 'Live', provider: 'pragmatic-live', imageUrl: `${CDN}/Mega-Wheel.webp`, code: 'game_id:23243' },
  { id: 'l6', name: "Dynasty Speed Baccarat 11", tag: 'Live', provider: 'evolutionwc', imageUrl: `${CDN}/Dynasty-Speed-Baccarat-11.webp`, code: 'game_id:29943' },
  { id: 'l7', name: "Dynasty Speed Baccarat 10", tag: 'Live', provider: 'evolutionwc', imageUrl: `${CDN}/Dynasty-Speed-Baccarat-10.webp`, code: 'game_id:29942' },
  { id: 'l8', name: "Dynasty Speed Baccarat 9", tag: 'Live', provider: 'evolutionwc', imageUrl: `${CDN}/Dynasty-Speed-Baccarat-9.webp`, code: 'game_id:29941' },
  { id: 'l9', name: "Real Casino Roulette", tag: 'Live', provider: 'absolute', imageUrl: `${CDN}/Real-Casino-Roulette.webp`, code: 'game_id:30876' },
  { id: 'l10', name: "Portal Roulette", tag: 'Live', provider: 'absolute', imageUrl: `${CDN}/Portal-Roulette.webp`, code: 'game_id:30875' },
  { id: 'l11', name: "360 Roulette", tag: 'Live', provider: 'absolute', imageUrl: `${CDN}/360-Roulette.webp`, code: 'game_id:30872' },
  { id: 'l12', name: "Crazy Time", tag: 'Live', provider: 'evolutionwc', imageUrl: `${CDN}/Crazy-Time.webp`, code: 'game_id:1' },
  { id: 'l13', name: "Lightning Roulette", tag: 'Live', provider: 'evolutionwc', imageUrl: `${CDN}/Lightning-Roulette.webp`, code: 'game_id:2' },
  { id: 'l14', name: "Monopoly Live", tag: 'Live', provider: 'evolutionwc', imageUrl: `${CDN}/Monopoly-Live.webp`, code: 'game_id:3' },
  { id: 'l15', name: "Mega Ball", tag: 'Live', provider: 'evolutionwc', imageUrl: `${CDN}/Mega-Ball.webp`, code: 'game_id:4' },
  { id: 'l16', name: "Dream Catcher", tag: 'Live', provider: 'evolutionwc', imageUrl: `${CDN}/Dream-Catcher.webp`, code: 'game_id:5' },
]

const defaultPromos: Promotion[] = [
  { id: 'p1', title: 'Hos Geldin Bonusu', description: 'Yeni uyeler icin ilk yatirimda %100 bonus, 50.000 TL ye kadar.', active: true },
  { id: 'p2', title: '%15 Yatirim Bonusu', description: 'Her yatirimina %15 ekstra bonus kazan.', active: true },
  { id: 'p3', title: 'Kayip Iade', description: 'Belirli gunlerde kayip iade kampanyasi.', active: true },
]

const defaultBanners: Banner[] = [
  { id: 'b1', title: '%100 Hos Geldin Bonusu', subtitle: 'Ilk yatirimina ozel avantajli oranlar.', imageUrl: 'https://images.pexels.com/photos/18692362/pexels-photo-18692362.jpeg?auto=compress&cs=tinysrgb&w=1200', linkUrl: '/promotions', active: true },
  { id: 'b2', title: 'Canli Bahiste Anlik Oranlar', subtitle: 'Maclari kacirma, oranlar saniyede guncellenir.', imageUrl: 'https://images.pexels.com/photos/114296/pexels-photo-114296.jpeg?auto=compress&cs=tinysrgb&w=1200', linkUrl: '/live', active: true },
  { id: 'b3', title: 'Casino Turnuvalari', subtitle: 'En cok kazananlara ekstra oduller.', imageUrl: 'https://images.pexels.com/photos/7594211/pexels-photo-7594211.jpeg?auto=compress&cs=tinysrgb&w=1200', linkUrl: '/tournaments', active: true },
]

export const DEFAULT_FAQ: FaqItem[] = [
  { id: 'f1', question: 'Nasil para yatirabilirim?', answer: 'Cuzdaninizdan banka havalesi, Papara, kripto veya kredi karti ile yatirim yapabilirsiniz.' },
  { id: 'f2', question: 'Para cekme suresi ne kadar?', answer: 'Cekim talepleri genellikle 24 saat icinde isleme alinir.' },
  { id: 'f3', question: 'Hesabimi nasil dogrularim?', answer: 'Kimlik belgeni destek ekibine ileterek hesabini dogrulayabilirsin.' },
  { id: 'f4', question: 'Bonuslari nasil kullanabilirim?', answer: 'Promosyonlar sayfasindaki aktif kampanyalari inceleyerek bonus talebinde bulunabilirsin.' },
]

export const DEFAULT_SUPPORT: SupportItem[] = [
  { id: 's1', title: 'Canli Sohbet', description: '7/24 anlik destek icin sag alttaki sohbet butonunu kullan.', badge: 'Aktif' },
  { id: 's2', title: 'E-posta', description: 'destek@BahisMosco.com adresine yazabilirsin.', badge: 'Aktif' },
]

export const DEFAULT_RESPONSIBLE: InfoBullet[] = [
  { id: 'r1', text: 'Bahis oynamayi eglence amacli tut, gelir kaynagi olarak gorma.' },
  { id: 'r2', text: 'Gunluk, haftalik veya aylik harcama limiti belirle.' },
  { id: 'r3', text: 'Kayiplarini telafi etmek icin daha fazla bahis oynamaktan kacin.' },
]

export const DEFAULT_PRIVACY: InfoBullet[] = [
  { id: 'pv1', text: 'Kisisel verileriniz 6698 sayili KVKK kapsaminda korunmaktadir.' },
  { id: 'pv2', text: 'Verileriniz ucuncu taraflarla paylasilmaz.' },
]

export const DEFAULT_TERMS: InfoBullet[] = [
  { id: 't1', text: 'Siteyi kullanmak icin 18 yasindan buyuk olman gerekir.' },
  { id: 't2', text: 'Bir kisi yalnizca bir hesap acabilir.' },
]

export const DEFAULT_SUPPORT_QUICK_REPLIES: string[] = [
  'Merhaba! Size nasil yardimci olabilirim?',
  'Talebiniz alindi, en kisa surede donus yapacagiz.',
  'Islem basariyla tamamlandi.',
]

const usersKey = 'zoe.users'
type StoredUser = { id: string; email: string; role: string; password: string }

export function ensureAdminUser(): void {
  const users = readJson<StoredUser[]>(usersKey, [])
  if (users.some((u) => u.email === 'admin@BahisMosco.com')) return
  writeJson(usersKey, [{ id: 'admin_1', email: 'admin@BahisMosco.com', role: 'admin', password: 'admin' }, ...users])
}

export function ensureSeeded(): void {
  ensureAdminUser()
  // Clear old seed versions
  ;['zoe.seeded.v2', 'zoe.seeded.v3', 'zoe.seeded.v4'].forEach(k => writeJson(k as any, false))
  const seeded = readJson<boolean>(seededFlagKey, false)
  if (seeded) return
  writeJson(KEYS.matches, defaultMatches)
  writeJson(KEYS.games, defaultGames)
  writeJson(KEYS.promotions, defaultPromos)
  writeJson(KEYS.banners, defaultBanners)
  writeJson(seededFlagKey, true)
}

