let s:plugin_root_dir = fnamemodify(resolve(expand('<sfile>:p')), ':h')
python << EOF
import sys
from os.path import normpath, join
import vim
plugin_root_dir = vim.eval('s:plugin_root_dir')
python_root_dir = normpath(join(plugin_root_dir, '..', 'python'))
sys.path.insert(0, python_root_dir)
import stillworking
EOF

function! s:stillworkingActivity()
  python stillworking.on_keypress()
endfunction

augroup Stillworking
  autocmd BufEnter,VimEnter * call s:stillworkingActivity()
  autocmd CursorMoved,CursorMovedI * call s:stillworkingActivity()
  autocmd BufWritePost * call s:stillworkingActivity()
augroup END
