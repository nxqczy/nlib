// 初始化Supabase连接
const supabaseUrl = 'https://iwpnajbmceobbkvwqtmy.supabase.co';
const supabaseKey = 'sb_publishable_-FWZBtjD8_JcgoaupQSq0w_2KCvd-FT';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 页面元素
const bookList = document.getElementById('book-list');
const searchInput = document.getElementById('search-input');
const fieldSelect = document.getElementById('field-select');
const searchBtn = document.getElementById('search-btn');
const syncBtn = document.getElementById('sync-btn');
const addBtn = document.getElementById('add-btn');
const editModal = document.getElementById('edit-modal');
const deleteModal = document.getElementById('delete-modal');
const bookForm = document.getElementById('book-form');
const modalTitle = document.getElementById('modal-title');
const bookUuid = document.getElementById('book-uuid');
const titleInput = document.getElementById('title');
const authorInput = document.getElementById('author');
const isbnInput = document.getElementById('isbn');
const summaryInput = document.getElementById('summary');
const processDomainInput = document.getElementById('process-domain');
const processGroupInput = document.getElementById('process-group');
const maturityLevelInput = document.getElementById('maturity-level');
const materialPropertyInput = document.getElementById('material-property');
const closeModalButtons = document.querySelectorAll('.close');
const cancelDeleteBtn = document.getElementById('cancel-delete');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const loading = document.getElementById('loading');

// 当前操作的图书ID
let currentBookId = null;

// 显示加载指示器
function showLoading() {
    loading.style.display = 'flex';
}

// 隐藏加载指示器
function hideLoading() {
    loading.style.display = 'none';
}

// 显示消息
function showMessage(message, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isError ? 'error' : 'success'}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// 生成UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 获取当前时间戳
function getCurrentTimestamp() {
    return Date.now();
}

// 加载图书列表
async function loadBooks() {
    showLoading();
    try {
        console.log('开始加载图书...');
        console.log('Supabase URL:', supabaseUrl);
        console.log('Supabase Key:', supabaseKey);
        
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .eq('is_deleted', false)
            .order('update_time', { ascending: false });
        
        console.log('加载图书结果:', { data, error });
        
        if (error) {
            throw error;
        }
        
        renderBooks(data);
    } catch (error) {
        console.error('加载图书失败:', error);
        showMessage(`加载图书失败: ${error.message}`, true);
    } finally {
        hideLoading();
    }
}

// 渲染图书列表
function renderBooks(books) {
    bookList.innerHTML = '';
    
    if (books.length === 0) {
        bookList.innerHTML = '<div class="empty-state">暂无图书</div>';
        return;
    }
    
    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        bookCard.innerHTML = `
            <div class="book-info">
                <h3>${book.title}</h3>
                <p><strong>作者:</strong> ${book.author}</p>
                <p><strong>ISBN:</strong> ${book.isbn || '无'}</p>
                <p><strong>内容简介:</strong> ${book.summary || '无'}</p>
                <p><strong>过程域:</strong> ${book.process_domain || '无'}</p>
                <p><strong>过程组:</strong> ${book.process_group || '无'}</p>
                <p><strong>成熟度等级:</strong> ${book.maturity_level || '无'}</p>
                <p><strong>材料性质:</strong> ${book.material_property || '无'}</p>
                <p class="update-time">更新时间: ${new Date(book.update_time).toLocaleString()}</p>
            </div>
            <div class="book-actions">
                <button class="edit-btn" data-id="${book.book_uuid}">编辑</button>
                <button class="delete-btn" data-id="${book.book_uuid}">删除</button>
            </div>
        `;
        bookList.appendChild(bookCard);
    });
    
    // 绑定编辑和删除按钮事件
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editBook(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => confirmDelete(btn.dataset.id));
    });
}

// 打开编辑模态框
async function editBook(uuid) {
    showLoading();
    try {
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .eq('book_uuid', uuid)
            .single();
        
        if (error) {
            throw error;
        }
        
        modalTitle.textContent = '编辑图书';
        bookUuid.value = data.book_uuid;
        titleInput.value = data.title;
        authorInput.value = data.author;
        isbnInput.value = data.isbn || '';
        summaryInput.value = data.summary || '';
        processDomainInput.value = data.process_domain || '';
        processGroupInput.value = data.process_group || '';
        maturityLevelInput.value = data.maturity_level || '';
        materialPropertyInput.value = data.material_property || '';
        
        editModal.style.display = 'block';
    } catch (error) {
        console.error('获取图书信息失败:', error);
        showMessage('获取图书信息失败', true);
    } finally {
        hideLoading();
    }
}

// 打开删除确认模态框
function confirmDelete(uuid) {
    currentBookId = uuid;
    deleteModal.style.display = 'block';
}

// 软删除图书
async function deleteBook(uuid) {
    showLoading();
    try {
        const { error } = await supabase
            .from('books')
            .update({
                is_deleted: true,
                update_time: getCurrentTimestamp()
            })
            .eq('book_uuid', uuid);
        
        if (error) {
            throw error;
        }
        
        showMessage('图书已删除');
        loadBooks();
    } catch (error) {
        console.error('删除图书失败:', error);
        showMessage('删除图书失败', true);
    } finally {
        hideLoading();
        deleteModal.style.display = 'none';
        currentBookId = null;
    }
}

// 搜索图书
async function searchBooks() {
    const searchTerm = searchInput.value.trim();
    const selectedField = fieldSelect.value;
    
    showLoading();
    try {
        let query = supabase
            .from('books')
            .select('*')
            .eq('is_deleted', false);
        
        if (searchTerm) {
            if (selectedField === '全部字段') {
                // 搜索所有字段
                query = query.or(
                    `title.ilike.%${searchTerm}%,` +
                    `author.ilike.%${searchTerm}%,` +
                    `isbn.ilike.%${searchTerm}%,` +
                    `summary.ilike.%${searchTerm}%,` +
                    `process_domain.ilike.%${searchTerm}%,` +
                    `process_group.ilike.%${searchTerm}%,` +
                    `maturity_level.ilike.%${searchTerm}%,` +
                    `material_property.ilike.%${searchTerm}%`
                );
            } else {
                // 搜索指定字段
                const fieldMap = {
                    '书名': 'title',
                    '作者': 'author',
                    'ISBN': 'isbn',
                    '内容简介': 'summary',
                    '过程域': 'process_domain',
                    '过程组': 'process_group',
                    '成熟度等级': 'maturity_level',
                    '材料性质': 'material_property'
                };
                
                const field = fieldMap[selectedField];
                if (field) {
                    query = query.ilike(field, `%${searchTerm}%`);
                }
            }
        }
        
        query = query.order('update_time', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) {
            throw error;
        }
        
        renderBooks(data);
    } catch (error) {
        console.error('搜索图书失败:', error);
        showMessage('搜索图书失败', true);
    } finally {
        hideLoading();
    }
}

// 同步数据
async function syncData() {
    showLoading();
    try {
        // 这里简单地重新加载数据，实际同步逻辑可能更复杂
        await loadBooks();
        showMessage('同步成功');
    } catch (error) {
        console.error('同步失败:', error);
        showMessage('同步失败', true);
    } finally {
        hideLoading();
    }
}

// 初始化页面
function init() {
    // 加载图书列表
    loadBooks();
    
    // 搜索按钮点击事件
    searchBtn.addEventListener('click', searchBooks);
    
    // 同步按钮点击事件
    syncBtn.addEventListener('click', syncData);
    
    // 新增按钮点击事件
    addBtn.addEventListener('click', () => {
        modalTitle.textContent = '新增图书';
        bookForm.reset();
        bookUuid.value = '';
        editModal.style.display = 'block';
    });
    
    // 表单提交事件
    bookForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            title: titleInput.value.trim(),
            author: authorInput.value.trim(),
            isbn: isbnInput.value.trim(),
            summary: summaryInput.value.trim(),
            process_domain: processDomainInput.value.trim(),
            process_group: processGroupInput.value.trim(),
            maturity_level: maturityLevelInput.value ? parseInt(maturityLevelInput.value) : null,
            material_property: materialPropertyInput.value.trim(),
            update_time: getCurrentTimestamp()
        };
        
        showLoading();
        try {
            if (bookUuid.value) {
                // 编辑现有图书
                const { error } = await supabase
                    .from('books')
                    .update(formData)
                    .eq('book_uuid', bookUuid.value);
                
                if (error) {
                    throw error;
                }
                
                showMessage('图书更新成功');
            } else {
                // 新增图书
                const newBook = {
                    ...formData,
                    book_uuid: generateUUID(),
                    is_deleted: false
                };
                
                const { error } = await supabase
                    .from('books')
                    .insert(newBook);
                
                if (error) {
                    throw error;
                }
                
                showMessage('图书新增成功');
            }
            
            editModal.style.display = 'none';
            loadBooks();
        } catch (error) {
            console.error('保存图书失败:', error);
            showMessage('保存图书失败', true);
        } finally {
            hideLoading();
        }
    });
    
    // 关闭模态框按钮点击事件
    closeModalButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            editModal.style.display = 'none';
            deleteModal.style.display = 'none';
        });
    });
    
    // 取消删除按钮点击事件
    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.style.display = 'none';
        currentBookId = null;
    });
    
    // 确认删除按钮点击事件
    confirmDeleteBtn.addEventListener('click', () => {
        if (currentBookId) {
            deleteBook(currentBookId);
        }
    });
    
    // 点击模态框外部关闭模态框
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
        if (e.target === deleteModal) {
            deleteModal.style.display = 'none';
            currentBookId = null;
        }
    });
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);