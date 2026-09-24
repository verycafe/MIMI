from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
path = root / 'styles.css'
css = path.read_text()

# Keep geometry and responsive layout intact; give the UI a neutral palette.
groups = {
    '#ffffff': ['#f5f2e9', '#faf8f2', '#fffdf8', '#fffdf6', '#fbfaf3', '#fbf9f21f', '#faf8f0', '#f7f8ec', '#e9eddf'],
    '#1e1e20': ['#313b30', '#657553', '#3a4633', '#38462e', '#586b45', '#748365'],
    '#555557': ['#70796a', '#59654d', '#747d6a', '#586a43', '#666e5d', '#7a8a63'],
    '#6f6f73': ['#74776a', '#767b6d', '#7d8575', '#7d8474', '#757e6c', '#77816e', '#7d8771', '#8d937f', '#737f65', '#78816d', '#727f64', '#717e63', '#788369', '#777a6c', '#7a846e', '#6f7d60', '#707e61', '#839271', '#778369', '#78846a', '#7f8b72', '#707c64', '#718064', '#829172', '#738265', '#83956d', '#8a927d'],
    '#eaeaec': ['#dcded1', '#e4e3d5', '#e1e5d9', '#e6e8de', '#eaebe3', '#eeeee4', '#dfe4d1', '#dce2ce', '#dadfcf'],
    '#dedee1': ['#bac0ac', '#d0d5c5', '#cdd2c1'],
    '#fafafa': ['#fbfaf5', '#f3f4eb', '#ecefe3', '#ecefe4', '#f2f1e8'],
    '#f5f5f6': ['#e7e9de', '#e9ecdf', '#f4f1e8', '#eeeee3', '#f4f3e9', '#eff3e7', '#f1f1e9'],
    '#fbfaf8': ['#eeebdf'],
    '#ffffffed': ['#f7f6edb5'],
    '#1e1e200d': ['#65755310', '#8b9d7312'],
    '#1e1e2014': ['#414c3310'],
    '#1e1e2008': ['#46533709', '#29362705'],
    '#1e1e2021': ['#53594426'],
    '#626266': ['#7d8d6b', '#8b9d73'],
    '#80664c': ['#9b7952'],
    '#faf5ef': ['#f6efdf'],
    '#85858a': ['#999887', '#8b987b'],
    '#ffffff': ['#f5f2e9', '#faf8f2', '#fffdf8', '#fffdf6', '#fbfaf3', '#fbf9f21f', '#faf8f0', '#f7f8ec', '#566343', '#e8f1dd'],
    '#242426': ['#e9eddf', '#293c29'],
    '#1b1b1e': ['#283429'],
    '#252528': ['#2d3b2d'],
    '#ededf0': ['#dce6cf', '#d8e5c6', '#c6dba8'],
    '#aaaaaf': ['#9baa8a', '#8fa47c', '#a1b884'],
    '#c6c6cb': ['#b7c6a5'],
    '#ffffff1a': ['#6373593b', '#6d805132'],
    '#ffffff26': ['#94a4803a'],
    '#c98587': ['#b38978'],
    '#18181b1a': ['#26302420'],
    '#18181b40': ['#252d2440'],
    '#f6f6f7': ['#efeee8'],
    '#eaeaec': ['#dcded1', '#e4e3d5', '#e1e5d9', '#e6e8de', '#eaebe3', '#eeeee4', '#dfe4d1', '#dce2ce', '#dadfcf', '#e5e6de'],
}
palette = {old: new for new, colors in groups.items() for old in colors}
css = re.sub(r'#[0-9a-fA-F]{3,8}\b', lambda match: palette.get(match[0], match[0]), css)
css = css.replace('--body-tint:147,155,155;', '')
css = re.sub(r'\.portrait:before\{[^}]*\}', '', css)
css = re.sub(r'\.cat-visual:before\{[^}]*\}', '', css)
css = css.replace('.primary-button:hover{background:var(--accent);', '.primary-button:hover{background:#3a3a3e;')
css = css.replace('.cat-card.selected{border-color:var(--accent);background:#ffffff;box-shadow:0 3px 12px #1e1e2008}', '.cat-card.selected{border-color:var(--ink);background:#ffffff;box-shadow:inset 0 0 0 .5px var(--ink)}')
path.write_text(css)

html = (root / 'index.html').read_text()
html = html.replace('name="theme-color" content="#f5f2e9"', 'name="theme-color" content="#ffffff"')
html = html.replace("fill='%23657553'", "fill='%231e1e20'")
(root / 'index.html').write_text(html)
