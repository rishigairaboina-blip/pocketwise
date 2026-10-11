
import { useState, useEffect } from "react";
import "./App.css";

const initialExpenses = [
  { id: 1, name: "Groceries", category: "Food", amount: 650 },
  { id: 2, name: "Metro & travel", category: "Travel", amount: 320 },
  { id: 3, name: "Coffee & snacks", category: "Lifestyle", amount: 180 },
];

const initialSubscriptions = [
  { id: 1, name: "Music subscription", amount: 199, dueDay: 15 },
  { id: 2, name: "Video streaming", amount: 299, dueDay: 20 },
];

const money = (n) =>
  "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [expenses, setExpenses] = useState(() =>
    readStorage("pocketwise-expenses", initialExpenses)
  );

  const [subscriptions, setSubscriptions] = useState(() =>
    readStorage("pocketwise-subscriptions", initialSubscriptions)
  );

  const [goal, setGoal] = useState(() =>
    readStorage("pocketwise-goal", 2000)
  );

  const [reserve, setReserve] = useState(1500);
  const [budget] = useState(10000);
  const [purchase, setPurchase] = useState(1200);
  const [days, setDays] = useState(20);
  const [active, setActive] = useState("Overview");

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");

  const [subName, setSubName] = useState("");
  const [subAmount, setSubAmount] = useState("");
  const [subDueDay, setSubDueDay] = useState("15");

  const [goalInput, setGoalInput] = useState(String(goal));

  const [unexpectedName, setUnexpectedName] = useState("");
  const [unexpectedAmount, setUnexpectedAmount] = useState("");

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  useEffect(() => {
    localStorage.setItem("pocketwise-expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(
      "pocketwise-subscriptions",
      JSON.stringify(subscriptions)
    );
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem("pocketwise-goal", JSON.stringify(goal));
  }, [goal]);

  const spent = expenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const subscriptionTotal = subscriptions.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const unexpectedTotal = expenses
    .filter((item) => item.category === "Unexpected")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const balance = budget - spent;
  const projected = balance - reserve - subscriptionTotal;
  const afterPurchase = balance - purchase - reserve - subscriptionTotal;

  const daily = Math.max(0, projected / Math.max(1, days));

  const safeToSpend = balance - reserve - subscriptionTotal - goal;

  const risk =
    projected < 0 ? "High" : projected < 2000 ? "Medium" : "Low";

  const health = Math.max(
    0,
    Math.min(100, Math.round((projected / budget) * 100))
  );

  const nav = [
    "Overview",
    "Transactions",
    "Simulator",
    "Savings",
    "Subscriptions",
    "Unexpected",
  ];

  function addExpense(e) {
    e.preventDefault();

    const value = Number(amount);

    if (
      !name.trim() ||
      !Number.isFinite(value) ||
      value <= 0 ||
      value > 100000
    ) {
      alert("Enter a valid expense name and amount.");
      return;
    }

    setExpenses((old) => [
      {
        id: Date.now(),
        name: name.trim(),
        category,
        amount: value,
        date: new Date().toISOString().slice(0, 10),
      },
      ...old,
    ]);

    setName("");
    setAmount("");
  }

  function addSubscription(e) {
    e.preventDefault();

    const value = Number(subAmount);
    const dueDay = Number(subDueDay);

    if (
      !subName.trim() ||
      !Number.isFinite(value) ||
      value <= 0 ||
      value > 100000 ||
      !Number.isInteger(dueDay) ||
      dueDay < 1 ||
      dueDay > 31
    ) {
      alert("Enter valid subscription details.");
      return;
    }

    setSubscriptions((old) => [
      ...old,
      {
        id: Date.now(),
        name: subName.trim(),
        amount: value,
        dueDay,
      },
    ]);

    setSubName("");
    setSubAmount("");
    setSubDueDay("15");
  }

  function confirmPurchase() {
    if (!Number.isFinite(purchase) || purchase <= 0 || purchase > 5000) {
      alert("Choose a valid purchase amount.");
      return;
    }

    if (
      !window.confirm(
        `Record a simulated purchase of ${money(purchase)}? No real payment will be made.`
      )
    ) {
      return;
    }

    setExpenses((old) => [
      {
        id: Date.now(),
        name: "Simulated purchase",
        category: "Shopping",
        amount: purchase,
        date: new Date().toISOString().slice(0, 10),
      },
      ...old,
    ]);

    setActive("Overview");
  }

  function addUnexpected(e) {
    e.preventDefault();

    const value = Number(unexpectedAmount);

    if (
      !unexpectedName.trim() ||
      !Number.isFinite(value) ||
      value <= 0 ||
      value > 100000
    ) {
      alert("Enter a valid unexpected expense.");
      return;
    }

    setExpenses((old) => [
      {
        id: Date.now(),
        name: unexpectedName.trim(),
        category: "Unexpected",
        amount: value,
        date: new Date().toISOString().slice(0, 10),
      },
      ...old,
    ]);

    setUnexpectedName("");
    setUnexpectedAmount("");
  }

  function exportCSV() {
    const rows = [
      ["Date", "Expense", "Category", "Amount"],
      ...expenses.map((item) => [
        item.date || "",
        item.name,
        item.category,
        item.amount,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            let text = String(value ?? "");

            // Prevent spreadsheet formula injection from text fields.
            if (/^[=+\-@\t\r]/.test(text)) {
              text = "'" + text;
            }

            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "pocketwise-transactions.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  const filteredExpenses = expenses.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      filterCategory === "All" || item.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  function deleteExpense(id) {
    setExpenses((old) => old.filter((item) => item.id !== id));
  }

  function deleteSubscription(id) {
    setSubscriptions((old) => old.filter((item) => item.id !== id));
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">₹</div>
          <div>
            <strong>pocketwise<span>.</span></strong>
            <small>YOUR MONEY, YOUR RULES</small>
          </div>
        </div>

        <div className="side-label">WORKSPACE</div>

        <nav aria-label="Main navigation">
          {nav.map((item, i) => (
            <button
              key={item}
              className={`nav-item ${active === item ? "selected" : ""}`}
              onClick={() => setActive(item)}
              aria-current={active === item ? "page" : undefined}
            >
              <span aria-hidden="true">
                {["◫", "↕", "✳", "◎", "▤", "⚠"][i]}
              </span>
              {item}
              {item === "Simulator" && (
                <span className="nav-tag">NEW</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="challenge-card">
            <span className="challenge-icon">✦</span>
            <p>30-DAY CHALLENGE</p>
            <h3>Make every rupee count.</h3>
            <div className="progress-track">
              <div
                style={{
                  width: `${Math.min(100, (spent / budget) * 100)}%`,
                }}
              />
            </div>
            <small>
              {Math.round((spent / budget) * 100)}% of budget used
            </small>
          </div>

          <div className="profile">
            <div className="avatar">R</div>
            <div>
              <strong>Rishi</strong>
              <small>Budget explorer</small>
            </div>
            <span className="profile-dots">•••</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> {active}
          </div>
          <div className="top-actions">
            <span className="live-dot" />
            <span className="demo-label">DEMO ACCOUNT</span>
            <div className="top-avatar">R</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">
                <span>✦</span> YOUR 30-DAY MONEY RESET
              </div>
              <h1>
                {active === "Overview" ? "Your money, in focus." : active}
              </h1>
              <p className="subtitle">
                Small decisions today. More freedom tomorrow.
              </p>
            </div>
            <div className="month-pill">
              <span>◷</span> 30-day plan <span className="pill-dot">●</span>
            </div>
          </section>

          {active === "Overview" && (
            <>
              <section className="hero-card">
                <div className="hero-main">
                  <div className="hero-label">
                    <span className="white-dot" /> TOTAL AVAILABLE BALANCE
                  </div>
                  <h2>{money(balance)}</h2>
                  <p>of {money(budget)} monthly budget</p>
                  <div className="hero-progress">
                    <div
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, (balance / budget) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="hero-foot">
                    <span>{money(spent)} spent</span>
                    <span>{money(Math.max(0, balance))} left</span>
                  </div>
                </div>

                <div className="hero-divider" />

                <div className="hero-side">
                  <div className="sparkle">✳</div>
                  <p className="hero-tip-label">YOUR MONEY NOTE</p>
                  <h3>
                    {projected < 0
                      ? "Time to slow down."
                      : "You're finding your rhythm."}
                  </h3>
                  <p>
                    {projected < 0
                      ? "Your projected money is below your planned commitments. Review your spending."
                      : "Keep your spending intentional and protect your future plans."}
                  </p>
                  <button
                    className="hero-link"
                    onClick={() => setActive("Simulator")}
                  >
                    Explore a decision <span>↗</span>
                  </button>
                </div>

                <div className="hero-decoration">₹</div>
              </section>

              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-top">
                    <span>DAILY ALLOWANCE</span>
                    <span className="stat-icon purple">↗</span>
                  </div>
                  <h3>{money(daily)}</h3>
                  <p>After planned commitments</p>
                  <div className="mini-bars">
                    {[32, 55, 42, 75, 50, 88, 62, 45, 72, 52, 83, 60].map(
                      (v, i) => (
                        <i key={i} style={{ height: `${v}%` }} />
                      )
                    )}
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>MONTH-END FORECAST</span>
                    <span className="stat-icon green">⌁</span>
                  </div>
                  <h3>{money(projected)}</h3>
                  <p>After reserve and subscriptions</p>
                  <div className="forecast-note">
                    <span>●</span> {risk} financial risk
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>FINANCIAL HEALTH</span>
                    <span className="stat-icon orange">♡</span>
                  </div>
                  <h3>
                    {health}<small>/100</small>
                  </h3>
                  <p>Based on projected balance</p>
                  <div className="health-track">
                    <div style={{ width: `${health}%` }} />
                  </div>
                </div>
              </section>

              <div className="section-heading">
                <div>
                  <h2>Your financial picture</h2>
                  <p>Know where every rupee is going.</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => setActive("Transactions")}
                >
                  All transactions ↗
                </button>
              </div>

              <section className="content-grid">
                <div className="panel spending-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Spending breakdown</h3>
                      <p>Your recorded expenses by category</p>
                    </div>
                    <span className="panel-icon">◉</span>
                  </div>

                  {[
                    "Food",
                    "Travel",
                    "Lifestyle",
                    "Shopping",
                    "Bills",
                    "Unexpected",
                  ].map((cat, i) => {
                    const value = expenses
                      .filter((item) => item.category === cat)
                      .reduce((sum, item) => sum + item.amount, 0);

                    const colors = [
                      "#8b7cf6",
                      "#54c7a5",
                      "#f1b96c",
                      "#ed8ca8",
                      "#6eb5ee",
                      "#e57373",
                    ];

                    return (
                      <div className="category-row" key={cat}>
                        <div className="category-info">
                          <span
                            className="category-dot"
                            style={{ background: colors[i] }}
                          />
                          <span>{cat}</span>
                          <strong>{money(value)}</strong>
                        </div>
                        <div className="category-track">
                          <div
                            style={{
                              width: `${Math.min(
                                100,
                                (value / budget) * 100
                              )}%`,
                              background: colors[i],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="spending-total">
                    <span>Total recorded</span>
                    <strong>{money(spent)}</strong>
                  </div>
                </div>

                <div className="panel quick-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Quick expense</h3>
                      <p>Log it and keep moving.</p>
                    </div>
                    <span className="panel-icon">＋</span>
                  </div>

                  <form className="expense-form" onSubmit={addExpense}>
                    <label htmlFor="expenseName">WHAT DID YOU SPEND ON?</label>
                    <input
                      id="expenseName"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Lunch with friends"
                      maxLength={80}
                      required
                    />

                    <div className="form-row">
                      <div>
                        <label htmlFor="expenseAmount">AMOUNT (₹)</label>
                        <input
                          id="expenseAmount"
                          type="number"
                          min="1"
                          max="100000"
                          step="1"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="250"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="expenseCategory">CATEGORY</label>
                        <select
                          id="expenseCategory"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          {[
                            "Food",
                            "Travel",
                            "Lifestyle",
                            "Shopping",
                            "Bills",
                          ].map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button className="primary-button" type="submit">
                      + Add expense <span>↗</span>
                    </button>
                  </form>
                </div>
              </section>
            </>
          )}

          {active === "Transactions" && (
            <section className="panel transactions-panel">
              <div className="panel-heading">
                <div>
                  <h3>All transactions</h3>
                  <p>{filteredExpenses.length} matching expenses</p>
                </div>
                <button className="secondary-button" onClick={exportCSV}>
                  Export CSV ↓
                </button>
              </div>

              <label htmlFor="transactionSearch">Search transactions</label>
              <input
                id="transactionSearch"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or category"
              />

              <label htmlFor="categoryFilter">Filter category</label>
              <select
                id="categoryFilter"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                {[
                  "All",
                  "Food",
                  "Travel",
                  "Lifestyle",
                  "Shopping",
                  "Bills",
                  "Unexpected",
                ].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              {filteredExpenses.length === 0 ? (
                <p className="empty-state">No matching transactions found.</p>
              ) : (
                filteredExpenses.map((item) => (
                  <div className="transaction-row" key={item.id}>
                    <div className="transaction-symbol">₹</div>
                    <div className="transaction-name">
                      <strong>{item.name}</strong>
                      <small>
                        {item.category}
                        {item.date ? ` · ${item.date}` : ""}
                      </small>
                    </div>
                    <strong className="transaction-amount">
                      −{money(item.amount)}
                    </strong>
                    <button
                      className="delete-button"
                      aria-label={`Delete ${item.name}`}
                      onClick={() => deleteExpense(item.id)}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}

              <button
                className="secondary-button"
                onClick={() => setActive("Overview")}
              >
                Back to overview
              </button>
            </section>
          )}

          {active === "Simulator" && (
            <section className="simulator-layout">
              <div className="panel simulator-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Before you buy</h3>
                    <p>Try a decision before spending real money.</p>
                  </div>
                  <span className="panel-icon">✳</span>
                </div>

                <label className="range-label" htmlFor="purchaseRange">
                  PROPOSED PURCHASE
                </label>
                <div className="range-value">{money(purchase)}</div>
                <input
                  id="purchaseRange"
                  className="range-input"
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={purchase}
                  onChange={(e) => setPurchase(Number(e.target.value))}
                />
                <div className="range-limits">
                  <span>₹0</span>
                  <span>₹5,000</span>
                </div>

                <label className="range-label" htmlFor="daysRemaining">
                  DAYS REMAINING IN YOUR PLAN
                </label>
                <input
                  id="daysRemaining"
                  type="number"
                  min="1"
                  max="30"
                  value={days}
                  onChange={(e) =>
                    setDays(
                      Math.max(1, Math.min(30, Number(e.target.value) || 1))
                    )
                  }
                />

                <div className="reserve-setting">
                  <label htmlFor="reserveAmount">
                    Upcoming bills + savings reserve
                  </label>
                  <input
                    id="reserveAmount"
                    type="number"
                    min="0"
                    max="100000"
                    value={reserve}
                    onChange={(e) =>
                      setReserve(
                        Math.max(
                          0,
                          Math.min(100000, Number(e.target.value) || 0)
                        )
                      )
                    }
                  />
                </div>

                <div className="simulation-warning">
                  {afterPurchase < 0
                    ? "Warning: this purchase puts your budget below zero."
                    : afterPurchase < 2000
                      ? "Caution: your remaining money is limited."
                      : "Your projected balance covers your planned commitments."}
                </div>

                <button
                  className="primary-button"
                  onClick={confirmPurchase}
                  disabled={purchase <= 0}
                >
                  Confirm simulated purchase ↗
                </button>
                <p className="helper-text">
                  This only updates your demo ledger. No real payment is made.
                </p>
              </div>

              <div className="panel impact-panel">
                <div className="panel-heading">
                  <div>
                    <h3>The ripple effect</h3>
                    <p>Here's how your decision changes things.</p>
                  </div>
                </div>
                <div className="impact-item">
                  <span>Current balance</span>
                  <strong>{money(balance)}</strong>
                </div>
                <div className="impact-item">
                  <span>After purchase</span>
                  <strong className={afterPurchase < 0 ? "negative" : ""}>
                    {money(balance - purchase)}
                  </strong>
                </div>
                <div className="impact-item">
                  <span>Daily allowance after</span>
                  <strong>{money(Math.max(0, afterPurchase / days))}</strong>
                </div>
                <div className="impact-item">
                  <span>After commitments</span>
                  <strong className={afterPurchase < 0 ? "negative" : ""}>
                    {money(afterPurchase)}
                  </strong>
                </div>
                <div className="impact-item">
                  <span>Risk level</span>
                  <strong
                    className={
                      afterPurchase < 0
                        ? "negative"
                        : afterPurchase < 2000
                          ? ""
                          : "positive"
                    }
                  >
                    {afterPurchase < 0
                      ? "High"
                      : afterPurchase < 2000
                        ? "Medium"
                        : "Low"}
                  </strong>
                </div>
                <div className="impact-callout">
                  <strong>
                    {afterPurchase < 2000
                      ? "Pause and rethink."
                      : "Looking manageable."}
                  </strong>
                  <p>
                    {afterPurchase < 2000
                      ? "Consider a cheaper option to protect your reserve."
                      : "This purchase fits your current demo budget projection."}
                  </p>
                </div>
              </div>
            </section>
          )}

          {active === "Savings" && (
            <section className="panel savings-panel">
              <div className="panel-heading">
                <div>
                  <h3>Your savings goal</h3>
                  <p>Give your future self something to look forward to.</p>
                </div>
                <span className="panel-icon">◎</span>
              </div>

              <div className="savings-hero">
                <span>MONTHLY SAVINGS TARGET</span>
                <h2>{money(goal)}</h2>
                <p>Set a goal that fits your budget.</p>
              </div>

              <form
                className="goal-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const value = Number(goalInput);

                  if (
                    !Number.isFinite(value) ||
                    value < 0 ||
                    value > 100000
                  ) {
                    alert("Enter a valid savings target.");
                    return;
                  }

                  setGoal(value);
                }}
              >
                <label htmlFor="goal">Savings target (₹)</label>
                <input
                  id="goal"
                  type="number"
                  min="0"
                  max="100000"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                />
                <button className="primary-button" type="submit">
                  Update savings goal ↗
                </button>
              </form>

              <div className="savings-result">
                <span>Available after spending and commitments</span>
                <strong>{money(balance - reserve - subscriptionTotal)}</strong>
                <p>
                  {balance - reserve - subscriptionTotal >= goal
                    ? "Your target fits the current projection."
                    : "Your target may need a spending adjustment."}
                </p>
                <p>Available after savings target: {money(safeToSpend)}</p>
              </div>
            </section>
          )}

          {active === "Subscriptions" && (
            <section className="panel savings-panel">
              <div className="panel-heading">
                <div>
                  <h3>Monthly subscriptions</h3>
                  <p>Track recurring expenses and upcoming bills.</p>
                </div>
                <span className="panel-icon">↻</span>
              </div>

              <div className="savings-hero">
                <span>TOTAL MONTHLY COMMITMENTS</span>
                <h2>{money(subscriptionTotal)}</h2>
                <p>{subscriptions.length} active subscriptions</p>
              </div>

              <form className="expense-form" onSubmit={addSubscription}>
                <label htmlFor="subName">SUBSCRIPTION NAME</label>
                <input
                  id="subName"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="e.g. Music subscription"
                  maxLength={80}
                  required
                />

                <label htmlFor="subAmount">MONTHLY AMOUNT (₹)</label>
                <input
                  id="subAmount"
                  type="number"
                  min="1"
                  max="100000"
                  value={subAmount}
                  onChange={(e) => setSubAmount(e.target.value)}
                  required
                />

                <label htmlFor="subDueDay">BILLING DAY (1–31)</label>
                <input
                  id="subDueDay"
                  type="number"
                  min="1"
                  max="31"
                  value={subDueDay}
                  onChange={(e) => setSubDueDay(e.target.value)}
                  required
                />

                <button className="primary-button" type="submit">
                  + Add subscription
                </button>
              </form>

              {subscriptions.length === 0 ? (
                <p className="empty-state">No subscriptions added yet.</p>
              ) : (
                subscriptions.map((sub) => (
                  <div className="transaction-row" key={sub.id}>
                    <div className="transaction-symbol">↻</div>
                    <div className="transaction-name">
                      <strong>{sub.name}</strong>
                      <small>Billing day: {sub.dueDay}</small>
                    </div>
                    <strong>{money(sub.amount)}/mo</strong>
                    <button
                      className="delete-button"
                      aria-label={`Delete ${sub.name}`}
                      onClick={() => deleteSubscription(sub.id)}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
              <p className="helper-text">
                Subscriptions are included in the forecast, but are not
                automatically deducted from recorded expenses.
              </p>
            </section>
          )}

          {active === "Unexpected" && (
            <section className="panel savings-panel">
              <div className="panel-heading">
                <div>
                  <h3>Unexpected expenses</h3>
                  <p>Track costs you did not plan for.</p>
                </div>
                <span className="panel-icon">⚠</span>
              </div>

              <div className="savings-hero">
                <span>UNEXPECTED SPENDING</span>
                <h2>{money(unexpectedTotal)}</h2>
                <p>
                  {expenses.filter((item) => item.category === "Unexpected")
                    .length}{" "}
                  recorded unexpected expenses
                </p>
              </div>

              <form className="expense-form" onSubmit={addUnexpected}>
                <label htmlFor="unexpectedName">WHAT HAPPENED?</label>
                <input
                  id="unexpectedName"
                  value={unexpectedName}
                  onChange={(e) => setUnexpectedName(e.target.value)}
                  placeholder="e.g. Emergency travel"
                  maxLength={80}
                  required
                />

                <label htmlFor="unexpectedAmount">AMOUNT (₹)</label>
                <input
                  id="unexpectedAmount"
                  type="number"
                  min="1"
                  max="100000"
                  value={unexpectedAmount}
                  onChange={(e) => setUnexpectedAmount(e.target.value)}
                  required
                />

                <button className="primary-button" type="submit">
                  + Record unexpected expense
                </button>
              </form>

              <h3>Recent unexpected expenses</h3>
              {expenses.filter((item) => item.category === "Unexpected")
                .length === 0 ? (
                <p className="empty-state">
                  No unexpected expenses recorded. That's a good start!
                </p>
              ) : (
                expenses
                  .filter((item) => item.category === "Unexpected")
                  .map((item) => (
                    <div className="transaction-row" key={item.id}>
                      <div className="transaction-symbol">!</div>
                      <div className="transaction-name">
                        <strong>{item.name}</strong>
                        <small>{item.date || "Recorded expense"}</small>
                      </div>
                      <strong className="transaction-amount">
                        −{money(item.amount)}
                      </strong>
                      <button
                        className="delete-button"
                        aria-label={`Delete ${item.name}`}
                        onClick={() => deleteExpense(item.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))
              )}
            </section>
          )}

          <footer className="footer">
            <span>✳ pocketwise</span>
            <span>Built for better money habits · Demo data only</span>
            <span>₹ Make it count.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
