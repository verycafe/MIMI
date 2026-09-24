/* Eight authored companions. Each has one fixed coat and one facial structure. */
window.CatCatalog = Object.freeze([
  {
    id: 'american', name: '美短', english: 'AMERICAN SHORTHAIR', coatName: '银色经典虎斑',
    description: '银灰底色，深炭色额纹。宽宽的脸颊里，藏着一点机灵。',
    rgb: '147,155,155', background: '#e6e8e5', accent: '#697770',
    coat: '#b9bfc0', light: '#e6e8e2', marking: '#343a3b', secondary: '#879193',
    iris: '#9fa866', pupil: '#242c29', nose: '#bd867f', ear: '#cba8a0',
    muzzle: '#e3e5df', earCoats: ['#8e9696', '#8e9696'], pattern: 1,
    shape: { kind: 'broad', width: 1.04, height: 1.03, depth: 1, earHeight: .61, earWidth: .63, earX: .68, eyeX: .46, eyeY: .005, eyeW: .19, eyeH: .20, eyeTilt: .04, muzzleW: 1.08, muzzleDepth: .17, muzzleY: -.255 }
  },
  {
    id: 'ginger', name: '橘猫', english: 'GINGER TABBY', coatName: '暖橘条纹',
    description: '一身暖橘色，额头三道纹。像一颗刚剥开的甜橘子。',
    rgb: '219,144,56', background: '#f5dfbf', accent: '#ae7438',
    coat: '#df9b38', light: '#f0ca84', marking: '#ad632d', secondary: '#ca7c30',
    iris: '#ab8c43', pupil: '#3f2d20', nose: '#c57d73', ear: '#e1a17e',
    muzzle: '#f6dab0', earCoats: ['#d48b32', '#d48b32'], pattern: 2,
    shape: { kind: 'classic', width: 1, height: 1, depth: 1, earHeight: .76, earWidth: .63, earX: .66, eyeX: .46, eyeY: .004, eyeW: .191, eyeH: .21, eyeTilt: 0, muzzleW: 1, muzzleDepth: .20, muzzleY: -.255 }
  },
  {
    id: 'black', name: '黑猫', english: 'MIDNIGHT BLACK', coatName: '纯炭黑',
    description: '从耳尖到下巴，都是安静的炭黑。两颗金绿色眼睛亮着。',
    rgb: '67,67,71', background: '#dcded5', accent: '#66734d',
    coat: '#29292e', light: '#29292e', marking: '#29292e', secondary: '#29292e',
    iris: '#c4bd51', pupil: '#191c20', nose: '#52404a', ear: '#7c626b',
    muzzle: '#303037', earCoats: ['#27272b', '#27272b'], pattern: 0,
    shape: { kind: 'classic', width: .95, height: 1.02, depth: 1, earHeight: .83, earWidth: .61, earX: .67, eyeX: .44, eyeY: .014, eyeW: .195, eyeH: .22, eyeTilt: .06, muzzleW: .91, muzzleDepth: .19, muzzleY: -.255 }
  },
  {
    id: 'tabby', name: '虎斑猫', english: 'BROWN MACKEREL TABBY', coatName: '棕色鱼骨纹',
    description: '暖棕底色，细细的深褐条纹。尖耳朵总是先听见新动静。',
    rgb: '146,111,75', background: '#e6ddcd', accent: '#81704b',
    coat: '#9f7e51', light: '#c6ad81', marking: '#493b2c', secondary: '#6b5237',
    iris: '#8d9e59', pupil: '#2d2c20', nose: '#a87562', ear: '#bb9279',
    muzzle: '#e1cdb1', earCoats: ['#705439', '#705439'], pattern: 3,
    shape: { kind: 'wedge', width: .95, height: 1.06, depth: 1, earHeight: .80, earWidth: .62, earX: .64, eyeX: .45, eyeY: .012, eyeW: .18, eyeH: .205, eyeTilt: .09, muzzleW: .94, muzzleDepth: .22, muzzleY: -.265 }
  },
  {
    id: 'cream', name: '奶白猫', english: 'CREAM WHITE', coatName: '奶白浅奶油色',
    description: '奶白的脸颊，暖琥珀色的眼睛。安静的一小只，轻轻陪着你。',
    rgb: '220,187,137', background: '#eee2ce', accent: '#ac895a',
    coat: '#e0c094', light: '#e0c094', marking: '#e0c094', secondary: '#e0c094',
    iris: '#b57434', pupil: '#3b2c23', nose: '#ca8d87', ear: '#d9ab99',
    muzzle: '#e9cfaa', earCoats: ['#d8b78a', '#d8b78a'], pattern: 0,
    shape: { kind: 'classic', width: 1, height: 1, depth: 1, rigid: true, earHeight: .64, earWidth: .63, earX: .66, eyeX: .46, eyeY: .004, eyeW: .191, eyeH: .21, eyeTilt: 0, muzzleW: 1, muzzleDepth: .14, muzzleY: -.255 }
  },
  {
    id: 'ragdoll', name: '布偶猫', english: 'SEAL BICOLOR RAGDOLL', coatName: '海豹双色',
    description: '海豹棕耳朵，白色倒 V 脸纹。蓝眼睛被蓬松的白颊轻轻围住。',
    rgb: '153,127,113', background: '#e5e4e5', accent: '#718d9a',
    coat: '#a9907b', light: '#f5efdf', marking: '#59463f', secondary: '#cab8a1',
    iris: '#6aa6ce', pupil: '#243b52', nose: '#d39a9b', ear: '#b39491',
    muzzle: '#f6eee0', earCoats: ['#59463f', '#59463f'], pattern: 4,
    shape: { kind: 'ruff', width: 1.05, height: 1.02, depth: 1.05, earHeight: .66, earWidth: .66, earX: .67, eyeX: .46, eyeY: .025, eyeW: .184, eyeH: .214, eyeTilt: .13, muzzleW: 1, muzzleDepth: .185, muzzleY: -.255 }
  },
  {
    id: 'calico', name: '三色梨花猫', english: 'CALICO TABBY', coatName: '三花带狸花纹',
    description: '白、橘、深棕拼在一起。两边不同的花纹，是它自己的小签名。',
    rgb: '192,128,76', background: '#f1dfd4', accent: '#a77a58',
    coat: '#eee6d6', light: '#f6efdf', marking: '#473831', secondary: '#cd833b',
    iris: '#a2a568', pupil: '#352c24', nose: '#d09088', ear: '#d5a39b',
    muzzle: '#f6eada', earCoats: ['#cd833b', '#473831'], pattern: 5,
    shape: { kind: 'classic', width: 1.02, height: 1, depth: 1, earHeight: .73, earWidth: .61, earX: .68, eyeX: .46, eyeY: .008, eyeW: .19, eyeH: .211, eyeTilt: .025, muzzleW: .99, muzzleDepth: .19, muzzleY: -.255 }
  },
  {
    id: 'cow', name: '黑白奶牛猫', english: 'BLACK & WHITE', coatName: '黑白不对称斑块',
    description: '白底上落了几块黑色墨迹。一只黑耳朵，一只白耳朵，好认得很。',
    rgb: '94,100,98', background: '#e2e5de', accent: '#747e69',
    coat: '#f3eee1', light: '#f3eee1', marking: '#303238', secondary: '#303238',
    iris: '#b9b360', pupil: '#272a2a', nose: '#d6959e', ear: '#d4a5a6',
    muzzle: '#f5ecdf', earCoats: ['#303238', '#eee9dc'], pattern: 6,
    shape: { kind: 'broad', width: 1.04, height: 1, depth: 1, earHeight: .70, earWidth: .63, earX: .67, eyeX: .46, eyeY: .004, eyeW: .191, eyeH: .21, eyeTilt: 0, muzzleW: 1.04, muzzleDepth: .19, muzzleY: -.255 }
  }
].map(cat => Object.freeze({ ...cat, shape: Object.freeze(cat.shape), earCoats: Object.freeze(cat.earCoats) })));
