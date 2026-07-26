const ctx = document.getElementById('myChart').getContext('2d');

        const myChart = new Chart(ctx, {
            type: 'bar', // 棒グラフを指定
            data: {
                labels: [], // 横棒の行の名前（1本だけなので「進捗」としています）
                datasets: [
                    {
                        label: '完了したページ',
                        data: [],
                        backgroundColor: '#000000', // 完了分の色（緑）
                        barThickness: 30 // ★棒の太さを30pxに固定
                    },
                    {
                        label: '残りのページ',
                        data: [],
                        backgroundColor: '#E0E0E0', // 残り分の色（グレー）
                        barThickness: 30
                    }
                ]
            },
            options: {
                indexAxis: 'y', // ★棒を横向きにする
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true, // X軸（横方向）に2つのデータを積み重ねる
                        beginAtZero: true,
                    },
                    y: {
                        stacked: true, // Y軸も積み重ねを有効にする
                        display: true // 「進捗」というラベルの縦軸文字を非表示にしてすっきりさせる
                    }
                },
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const datasetIndex = context.datasetIndex;
                                const index = context.dataIndex;
                                const done = context.chart.data.datasets[0].data[index];
                                const remaining = context.chart.data.datasets[1].data[index];
                                const total = done + remaining;
                                const value = context.raw;
                                const percentage = Math.round((value / total)*100);

                                if (datasetIndex === 0) {
                                    return `完了したページ: ${value}p (${percentage}%)`;
                                } else {
                                    return `残りのページ: ${value}p (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            }
        });

let booksList = JSON.parse(localStorage.getItem('studyBooks')) || [];

updateApp();


function updateApp() {
    myChart.data.labels = [];
    myChart.data.datasets[0].data = [];
    myChart.data.datasets[1].data = [];

    const managementContainer = document.getElementById('book-management-container') || document.getElementById('delete-buttons-container');
    managementContainer.innerHTML = '';

    if (booksList.length === 0) {
        managementContainer.innerText = '登録された参考書はありません。';
    }

    booksList.forEach((book,index) => {

        myChart.data.labels.push(book.name);
        myChart.data.datasets[0].data.push(book.done);
        myChart.data.datasets[1].data.push(book.remaining);

        const bookRow = document.createElement('div');
        bookRow.style.margin = "10px 0";
        bookRow.style.display = "flex";
        bookRow.style.justifyContent = "center";
        bookRow.style.alignItems = "center";
        bookRow.style.gap = "10px";

        const titlespan = document.createElement('span');
        titlespan.innerText = `${book.name} (${book.done}/${book.total}p)`;
        titlespan.style.fontWeight = "bold";
        titlespan.style.fontSize = "18px";

        const editBtn = document.createElement('button');
        editBtn.innerText = '進捗を更新';
        editBtn.style.backgroundColor = '#f9f9f9';
        editBtn.onclick = function() {
            editBookProgress(index);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = '削除';
        deleteBtn.style.backgroundColor = '#f9f9f9';
        deleteBtn.onclick = function() {
            deleteBookData(index);
        };

        bookRow.appendChild(titlespan);
        bookRow.appendChild(editBtn);
        bookRow.appendChild(deleteBtn);
        managementContainer.appendChild(bookRow);
    });

    const newHeight = (booksList.length * 55) + 70;
    myChart.canvas.parentNode.style.height = booksList.length > 0 ? newHeight + 'px' : '100px';

    localStorage.setItem('studyBooks', JSON.stringify(booksList));

    myChart.update();
}

function editBookProgress(index) {
    const book = booksList[index];

    const newDoneInput = prompt(`「${book.name}」の新しい「終わったページ数」を入力してください（総ページ数: ${book.total}p）`, book.done);

    if (newDoneInput === null) return;

    const newDone = Number(newDoneInput);

    if (isNaN(newDone) || newDoneInput.trim() === '') {
        alert("有効な数字を入力してください。");
        return;
    }
    if (newDone > book.total) {
        alert("終わったページ数が総ページ数を超えています！");
        return;
    }
    if(newDone < 0) {
        alert("0以上の数値を入力してください。");
        return;
    }

    book.done = newDone;
    book.remaining = book.total - newDone;

    updateApp();

    const percent = Math.round((book.done / book.total) * 100);
    document.getElementById('progressText').innerText = `【直近履歴】${book.name} の進捗率: ${percent}% (完了: ${book.done}p ・ あと${book.remaining}p)`;
}

async function addBookData() {
    const bookNameInput = document.getElementById('book-name').value.trim();
    const bookName = bookNameInput ? bookNameInput : '無題の参考書';
    const total = Number(document.getElementById('all-pages-number').value);
    const done = Number(document.getElementById('donePages').value);

    if (done > total) {
        alert("終わったページ数が総ページ数を超えています！");
        return;
    }
    const remaining = total - done;

    // 1. データの保存とアプリの更新
    booksList.push({
        name: bookName, total: total, done: done, remaining: remaining, createdAt: Date.now()
    });
    updateApp();

    // 2. 履歴テキストの更新
    const percent = Math.round((done / total) * 100);
    document.getElementById('progressText').innerText = ` 【直近履歴】${bookName} の進捗率: ${percent}% (完了: ${done}p ・ あと${remaining}p)`;
    
    // 3. フォームのクリア
    document.getElementById('book-name').value = '';
    document.getElementById('all-pages-number').value = '';
    document.getElementById('donePages').value = '';
}
    
        function deleteBookData(index) {
            if (confirm(`「${booksList[index].name}」のデータを削除しますか？`)) {

                booksList.splice(index, 1);

                updateApp();
                document.getElementById('progressText').innerText =`データを削除しました。`;
            }}

        function sortBooks(type) {
            if (booksList.length <= 1) return;
            
            if (type === 'recently') {
                booksList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            } else if (type === 'old')  {
                booksList.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            } else if (type === 'amount') {
                booksList.sort((a, b) => b.total - a.total);
            }
            
            updateApp();
        }

        window.addEventListener('scroll', function() {
            const header = document.querySelector('header nav');

            if (window.scrollY > 50) {
                header.classList.remove('hide-nav');
                header.classList.add('show-nav');
            } else {
                header.classList.remove('show-nav');
                header.classList.add('hide-nav');
            }
        });

        // darkmode-js の初期化とボタンの表示
const options = {
  bottom: '32px', // ボタンの配置（下からの位置）
  right: '32px',  // ボタンの配置（右からの位置）
  left: 'unset',  // 逆側はunset
  time: '0.3s',   // アニメーションの時間
  mixColor: '#fff', // ミックスする色
  backgroundColor: '#fff',  // 全体の背景色
  buttonColorInverted: '#fff', // 反転時のボタン色
  buttonColorBlur: '#100f2c', // 通常時のボタン色
  saveInCookies: true, // 好みをクッキーに保存するかどうか
  label: ' ', // ボタンに表示する文字（お好みで変更可能）
  autoMatchOsTheme: true // OSのテーマ（ダークモード）に自動で合わせるか
}

const darkmode = new Darkmode(options);
darkmode.showWidget();
