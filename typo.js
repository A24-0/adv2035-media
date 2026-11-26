(function () {
  var PRE = new Set(("в во на с со к ко у о об обо по за из изо от ото до для при про над надо под подо перед передо без безо через между меж около кроме ради сквозь среди вдоль мимо после вместо вокруг вроде ввиду вследствие благодаря вопреки согласно навстречу наперекор наподобие насчёт сверх внутри вне возле подле близ посреди накануне прежде свыше ниже выше против касательно относительно из-за из-под по-над").split(" "));
  var CONJ = new Set(("и а но да или либо что чтобы как чем когда если хотя пока поскольку поэтому потому зато тоже также причём притом то не ни же ли бы ведь вот вон даже уже ещё еще только лишь именно просто почти очень разве неужели мол де").split(" "));
  var UNITS = new Set(("секунд секунды минут минуты вопрос вопроса вопросов шаг шага шагов ход хода ходов раз раза человек человека дней дня день лет года год годов месяцев месяц недель недели страниц страницы процентов % ₽ рублей рубля баллов балла января февраля марта апреля мая июня июля августа сентября октября ноября декабря годом").split(" "));
  var SKIP = {SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1, PRE: 1, INPUT: 1, OPTION: 1};

  function isStop(word) {
    var w = word.toLowerCase().replace(/\u2011/g, "-")
      .replace(/^[«„("]+/, "").replace(/[,;:]+$/, "");
    return PRE.has(w) || CONJ.has(w);
  }

  function tie(s) {
    // неразрывный дефис внутри слов: кто-то, из-за, Leader-ID
    s = s.replace(/([A-Za-zА-Яа-яЁё])-(?=[A-Za-zА-Яа-яЁё])/g, "$1\u2011");

    // разбираем на слова и промежутки; заменяем только нужные пробелы
    var parts = s.split(/(\s+)/);
    for (var i = 1; i < parts.length; i += 2) {
      var prev = parts[i - 1], next = parts[i + 1];
      if (!prev || !next) continue;

      // тире не отрывается от предыдущего слова и не начинает строку
      if (/^[—–]/.test(next)) { parts[i] = "\u00A0"; continue; }

      // число + единица измерения или месяц: 25 секунд, 31 декабря
      if (/^\d+$/.test(prev) && UNITS.has(next.toLowerCase().replace(/[.,:;!?»)]+$/, ""))) {
        parts[i] = "\u00A0"; continue;
      }

      // бренд
      if (prev === "20.35") { parts[i] = "\u00A0"; continue; }

      // предлог, союз, частица + следующее слово
      if (isStop(prev) && /^[A-Za-zА-Яа-яЁё0-9«(]/.test(next)) {
        parts[i] = "\u00A0";
      }
    }
    return parts.join("");
  }

  function processNode(node) {
    if (node.nodeType !== 3) return;
    var p = node.parentNode;
    if (!p || SKIP[p.nodeName]) return;
    if (p.closest && p.closest(".no-typo")) return;
    var s = node.nodeValue;
    if (!s || s.length < 2 || !/[ \t\u00A0]/.test(s)) return;
    var t = tie(s);
    if (t !== s) node.nodeValue = t;
  }

  function walk(root) {
    if (root.nodeType === 3) { processNode(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var list = [], n;
    while ((n = w.nextNode())) list.push(n);
    list.forEach(processNode);
  }

  if (document.body) walk(document.body);

  var scheduled = false;
  var obs = new MutationObserver(function (muts) {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === "childList") {
          for (var j = 0; j < m.addedNodes.length; j++) walk(m.addedNodes[j]);
        } else if (m.type === "characterData") {
          processNode(m.target);
        }
      }
    });
  });
  obs.observe(document.body, {childList: true, subtree: true, characterData: true});
})();
