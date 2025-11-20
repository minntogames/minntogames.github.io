document.addEventListener('DOMContentLoaded', () => {
    const fileTreeContainer = document.getElementById('file-tree');
    const fileContentContainer = document.getElementById('file-content');
    const imagePreviewContainer = document.getElementById('image-preview');
    const lineNumbersContainer = document.getElementById('line-numbers');
    const breadcrumbContainer = document.getElementById('breadcrumb');
    const fileInfoContainer = document.getElementById('file-info');
    const downloadLink = document.getElementById('download-link');
    const fileViewContainer = document.querySelector('.file-view');
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const expandSidebarBtn = document.getElementById('expand-sidebar');

    // サイドバーのトグル機能
    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('collapsed');
        expandSidebarBtn.style.display = 'block';
    });

    expandSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('collapsed');
        expandSidebarBtn.style.display = 'none';
    });

    fetch('file_tree.json')
        .then(response => response.json())
        .then(data => {
            const treeHtml = createTreeHtml(data, 'old bots');
            fileTreeContainer.innerHTML = treeHtml;
            addEventListeners();
        });

    function createTreeHtml(node, currentPath) {
        let html = '<ul>';
        const children = node.children || [];
        // JSONファイルで既に順序が設定されているため、ソートしない

        for (const child of children) {
            const newPath = `${currentPath}/${child.name}`;
            if (child.type === 'directory') {
                html += `<li>
                            <div class="dir-item collapsed" data-path="${newPath}">
                                <span class="icon"></span>${child.name}
                            </div>
                            ${createTreeHtml(child, newPath)}
                         </li>`;
            } else {
                html += `<li>
                            <div class="file-item" data-path="${child.path}" data-breadcrumb="${newPath}">
                                <span class="icon"></span>${child.name}
                            </div>
                         </li>`;
            }
        }
        html += '</ul>';
        return html;
    }

    function addEventListeners() {
        fileTreeContainer.querySelectorAll('.dir-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                item.classList.toggle('collapsed');
            });
        });

        fileTreeContainer.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const path = item.dataset.path;
                const breadcrumb = item.dataset.breadcrumb;
                loadFileContent(path, breadcrumb);
            });
        });
    }

    function loadFileContent(path, breadcrumb) {
        const extension = path.split('.').pop().toLowerCase();
        const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg'];

        updateBreadcrumb(breadcrumb);
        downloadLink.href = path;
        downloadLink.download = path.split('/').pop();
        downloadLink.style.display = 'inline-block';


        if (imageExtensions.includes(extension)) {
            fileViewContainer.style.display = 'none';
            imagePreviewContainer.style.display = 'block';
            imagePreviewContainer.innerHTML = `<img src="${path}" alt="${path}">`;
            fileInfoContainer.textContent = '';
        } else {
            fileViewContainer.style.display = 'flex';
            imagePreviewContainer.style.display = 'none';
            
            fetch(path)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const size = response.headers.get("content-length");
                    fileInfoContainer.textContent = `${(size / 1024).toFixed(2)} KB`;
                    return response.text();
                })
                .then(text => {
                    // highlight.jsによって追加されたクラスを削除
                    fileContentContainer.removeAttribute('data-highlighted');
                    fileContentContainer.className = 'hljs';

                    fileContentContainer.textContent = text;
                    hljs.highlightElement(fileContentContainer);
                    updateLineNumbers(text);
                })
                .catch(error => {
                    console.error('Error loading file:', error);
                    fileContentContainer.textContent = `Error loading file: ${path}\n\n${error}`;
                    lineNumbersContainer.innerHTML = '';
                });
        }
    }

    function updateLineNumbers(text) {
        const lineCount = text.split('\n').length;
        lineNumbersContainer.innerHTML = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
    }

    function updateBreadcrumb(path) {
        const parts = path.split('/');
        let html = '';
        let currentPath = '';
        parts.forEach((part, index) => {
            currentPath += (index > 0 ? '/' : '') + part;
            if (index < parts.length -1) {
                html += `📁 <a href="#" class="breadcrumb-link" data-path="${currentPath}">${part}</a> / `;
            } else {
                html += `📄 ${part}`;
            }
        });
        breadcrumbContainer.innerHTML = html;
    }
});