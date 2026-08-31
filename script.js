/* =====================================================
   WATER COUNT - FULL FRONTEND JAVASCRIPT
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    let orders = JSON.parse(localStorage.getItem("waterOrders")) || [];
    let payments = JSON.parse(localStorage.getItem("waterPayments")) || [];
    let bottleCounts = JSON.parse(localStorage.getItem("waterBottleCounts")) || [];

    // ==========================================
    // NAVIGATION & VIEW SYSTEM 
    // ==========================================
    const dashboardNav = document.getElementById("dashboardNav");
    const paymentsNav = document.getElementById("paymentsNav");
    const dashboardView = document.getElementById("dashboardView");
    const paymentsView = document.getElementById("paymentsView");

    function showView(viewName, addToHistory = true) {
        if(dashboardView) dashboardView.classList.remove("active-view");
        if(paymentsView) paymentsView.classList.remove("active-view");
        if(dashboardNav) dashboardNav.classList.remove("active");
        if(paymentsNav) paymentsNav.classList.remove("active");

        if (viewName === "dashboard") {
            if(dashboardView) dashboardView.classList.add("active-view");
            if(dashboardNav) dashboardNav.classList.add("active");
            renderDashboard();
        }
        if (viewName === "payments") {
            if(paymentsView) paymentsView.classList.add("active-view");
            if(paymentsNav) paymentsNav.classList.add("active");
            renderPayments();
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (addToHistory) history.pushState({ page: viewName }, viewName, `#${viewName}`);
    }

    window.addEventListener("popstate", (event) => {
        if (event.state && event.state.page) showView(event.state.page, false); 
        else showView("dashboard", false); 
    });

    if(dashboardNav) dashboardNav.addEventListener("click", () => showView("dashboard"));
    if(paymentsNav) paymentsNav.addEventListener("click", () => showView("payments"));

    // ==========================================
    // START NEW SET
    // ==========================================
    function setDefaultOrderDate() {
        const orderDate = document.getElementById("orderDate");
        const orderTime = document.getElementById("orderTime");
        const now = new Date();
        const date = now.toISOString().split("T")[0];
        if (orderDate) orderDate.value = date;
        if (orderTime) orderTime.value = now.toTimeString().slice(0, 5);
    }

    // Logic to automatically change price (With Tap = 35, Without Tap = 30)
    const orderBottleType = document.getElementById("orderBottleType");
    const orderBottlePrice = document.getElementById("orderBottlePrice");
    if(orderBottleType && orderBottlePrice) {
        orderBottleType.addEventListener("change", function() {
            if(this.value === "With Tap") {
                orderBottlePrice.value = "35";
            } else if(this.value === "Without Tap") {
                orderBottlePrice.value = "30";
            }
        });
    }

    const orderBtn = document.getElementById("orderBtn");
    if (orderBtn) {
        orderBtn.addEventListener("click", function (e) {
            e.preventDefault(); 
            const orderBottleCount = document.getElementById("orderBottleCount");
            const orderPayingFor = document.getElementById("orderPayingFor");
            const orderPayerPhone = document.getElementById("orderPayerPhone");
            const orderUpiId = document.getElementById("orderUpiId"); 
            const orderDate = document.getElementById("orderDate");
            const orderTime = document.getElementById("orderTime");

            const bottles = Number(orderBottleCount.value);
            const pricePerBottle = Number(orderBottlePrice.value);
            const bType = orderBottleType ? orderBottleType.value : "Unknown";
            const date = orderDate.value;
            const time = orderTime.value;
            const upiIdVal = orderUpiId ? orderUpiId.value.trim() : ""; 

            if (!date || !time) { alert("Please select date and time."); return; }
            if (!pricePerBottle || pricePerBottle <= 0) { alert("Please enter a valid Per Bottle Price."); return; }
            if (!upiIdVal) { alert("Please enter the Receiver UPI ID."); return; } 

            const totalAmount = bottles * pricePerBottle;

            const order = {
                id: "WC-" + String(Date.now()).slice(-6),
                bottles: bottles, 
                bottleType: bType,
                pricePerBottle: pricePerBottle,
                amount: totalAmount,
                thisSetPayingFor: orderPayingFor ? orderPayingFor.value.trim() : "",
                billPayerPhone: orderPayerPhone ? orderPayerPhone.value.trim() : "",
                upiId: upiIdVal,
                date: formatDate(date), 
                time: time,
                status: "Running" // Status is Running initially
            };

            orders.unshift(order);
            localStorage.setItem("waterOrders", JSON.stringify(orders));

            alert(`New Set Started Successfully!\n${bottles} Bottles (${bType}) @ ₹${pricePerBottle} each.\nTotal Value: ₹${totalAmount}\nUPI ID: ${upiIdVal}`);
            
            // Reset fields to default values
            if(orderBottleCount) orderBottleCount.value = "4";
            if(orderBottleType) orderBottleType.value = "With Tap";
            if(orderBottlePrice) orderBottlePrice.value = "35";
            if(orderPayingFor) orderPayingFor.value = "";
            if(orderPayerPhone) orderPayerPhone.value = "";
            if(orderUpiId) orderUpiId.value = ""; 
            setDefaultOrderDate();
            renderDashboard();
        });
    }

    // ==========================================
    // DASHBOARD METRICS
    // ==========================================
    function renderDashboard() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthly = bottleCounts.filter(item => {
            const parts = item.date.split("/");
            return (Number(parts[1]) - 1 === currentMonth && Number(parts[2]) === currentYear);
        }).length;
        if(document.getElementById("monthlyBottles")) document.getElementById("monthlyBottles").textContent = monthly;

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekly = bottleCounts.filter(item => {
            const parts = item.date.split("/");
            const date = new Date(parts[2], parts[1] - 1, parts[0]);
            return date >= weekAgo;
        }).length;
        if(document.getElementById("weeklyBottles")) document.getElementById("weeklyBottles").textContent = weekly;

        // Calculate Unique UPI IDs
        const uniqueUpis = [...new Set(orders.map(o => o.upiId).filter(id => id && id.trim() !== ""))];
        if(document.getElementById("savedUpiCount")) {
            document.getElementById("savedUpiCount").textContent = uniqueUpis.length;
        }

        renderCycle();
        renderRecentBottleCounts();
    }

    function renderRecentBottleCounts() {
        const container = document.getElementById("recentBottleContainer");
        if (!container) return;
        if (bottleCounts.length === 0) {
            container.innerHTML = `<div class="empty-state">No bottle count added yet.</div>`; return;
        }
        
        container.innerHTML = bottleCounts.slice(0, 10).map(item => {
            const order = orders.find(o => o.id === item.orderId);
            let payingForText = order && order.thisSetPayingFor && order.thisSetPayingFor.trim() !== "" ? order.thisSetPayingFor : "N/A";
            let phone = order && order.billPayerPhone && order.billPayerPhone.trim() !== "" ? order.billPayerPhone : "N/A";

            // Creating text format for copy button
            const copyText = `${item.bottleNumber}${getOrdinal(item.bottleNumber)} Bottle (Set: ${item.orderId})\n👤 ${payingForText}  |  📞 ${phone}\n🗓️ ${item.date} - ${item.day}  |  ⏰ ${item.time}`;
            const encodedText = encodeURIComponent(copyText); // Encoding to prevent HTML syntax errors

            return `
                <div class="history-card">
                    <div>
                        <strong style="font-size: 15px; color: #0d47a1;">${item.bottleNumber}${getOrdinal(item.bottleNumber)} Bottle (Set: ${item.orderId})</strong>
                        <p style="margin: 6px 0 4px 0; color: #1976d2; font-size: 13px; font-weight: bold;">
                            👤 ${payingForText} &nbsp;|&nbsp; 📞 ${phone}
                        </p>
                        <p style="color: #64b5f6; font-size: 12px;">🗓️ ${item.date} - ${item.day} &nbsp;|&nbsp; ⏰ ${item.time}</p>
                    </div>
                    <!-- Copy button added here -->
                    <button onclick="copyToClipboard(this, '${encodedText}')" class="copy-btn" title="Copy Details">📋</button>
                </div>`;
        }).join("");
    }

    // Global function to copy details to clipboard
    window.copyToClipboard = function(btnElement, encodedText) {
        const textToCopy = decodeURIComponent(encodedText); // Decode the text
        navigator.clipboard.writeText(textToCopy).then(() => {
            // Change icon if copy is successful
            btnElement.innerHTML = "✅";
            setTimeout(() => { btnElement.innerHTML = "📋"; }, 2000); // Revert back after 2 seconds
        }).catch(err => {
            console.error("Copy failed: ", err);
            alert("Failed to copy!");
        });
    }

    // ==========================================
    // CYCLE VISUALIZER & UPI APP PAYMENT MODAL
    // ==========================================
    const upiModal = document.getElementById("upiModal");
    const closeUpiModalBtn = document.getElementById("closeUpiModalBtn");
    const proceedToFormBtn = document.getElementById("proceedToFormBtn");

    if(closeUpiModalBtn) closeUpiModalBtn.onclick = () => { upiModal.classList.add("hidden"); };

    window.openUPI = function() {
        const currentOrder = orders[0];
        if(!currentOrder) return;
        
        const amountStr = Number(currentOrder.amount).toFixed(2); 
        const receiverName = encodeURIComponent("Water Count");
        // নতুন: পেমেন্টের কারণ (Note) যোগ করা হয়েছে
        const transactionNote = encodeURIComponent("Water Bill Payment"); 
        
        const targetUpiId = currentOrder.upiId || "your_default_upi@ybl"; 
        
        // নতুন: লিংকে &tn=${transactionNote} যোগ করা হয়েছে
        const upiLink = `upi://pay?pa=${targetUpiId}&pn=${receiverName}&tn=${transactionNote}&am=${amountStr}&cu=INR`;
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (!isMobile) {
            alert("⚠️ UPI Payment is only available on Mobile phones.\nPlease open this website on your mobile to pay via UPI Apps.");
            return;
        }

        const a = document.createElement('a');
        a.href = upiLink;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function renderCycle() {
        const container = document.getElementById("currentCycle");
        if(!container) return;
        
        const currentOrder = orders[0]; 
        const addBtn = document.getElementById("addDashboardBottleBtn");
        const payBtn = document.getElementById("payDashboardBtn");

        if (!currentOrder) {
            container.innerHTML = `<div class="empty-state">Select a Set and Start to track cycle.</div>`;
            if(document.getElementById("cycleCount")) document.getElementById("cycleCount").textContent = "0 / 0 Bottles";
            if(document.getElementById("cycleStatus")) document.getElementById("cycleStatus").textContent = "Waiting";
            if(document.getElementById("cycleText")) document.getElementById("cycleText").textContent = "No active cycle";
            if(addBtn) addBtn.classList.add("hidden");
            if(payBtn) payBtn.classList.add("hidden");
            return;
        }

        const count = bottleCounts.filter(item => item.orderId === currentOrder.id).length;
        const total = currentOrder.bottles;

        container.innerHTML = Array.from({ length: total }, (_, index) => {
            const number = index + 1;
            const completed = number <= count;
            return `
                <div class="cycle-step ${completed ? "completed" : ""} ${number === count + 1 ? "active" : ""}">
                    <div class="cycle-circle">${completed ? "✓" : number}</div>
                    <h4>${number}${getOrdinal(number)}</h4>
                    <p>${completed ? "Completed" : "Waiting"}</p>
                </div>
                ${number < total ? `<div class="cycle-line ${number < count ? "completed-line" : ""}"></div>` : ""}
            `;
        }).join("");

        if(document.getElementById("cycleCount")) document.getElementById("cycleCount").textContent = `${count} / ${total} Bottles`;
        if(document.getElementById("cycleText")) document.getElementById("cycleText").textContent = `Running Set ID: ${currentOrder.id}`;

        if(count >= total) {
            // Check if the bill has already been paid
            if (currentOrder.status === "Paid") {
                if(document.getElementById("cycleStatus")) document.getElementById("cycleStatus").textContent = "✅ Bill Paid";
                if(addBtn) addBtn.classList.add("hidden");
                if(payBtn) payBtn.classList.add("hidden"); // Hide pay button if already paid
            } else {
                if(document.getElementById("cycleStatus")) document.getElementById("cycleStatus").textContent = "✓ Set Completed (Unpaid)";
                if(addBtn) addBtn.classList.add("hidden");
                
                if(payBtn) {
                    payBtn.classList.remove("hidden");
                    payBtn.onclick = () => {
                        document.getElementById("upiAmountStr").textContent = "₹" + currentOrder.amount;
                        upiModal.classList.remove("hidden");

                        proceedToFormBtn.onclick = () => {
                            upiModal.classList.add("hidden");
                            showView("payments");
                            
                            const pForm = document.getElementById("paymentForm");
                            if(pForm) pForm.classList.remove("hidden");
                            setDefaultPaymentDate();
                            
                            // Auto-fill Payment Form
                            if(document.getElementById("paymentSetId")) document.getElementById("paymentSetId").value = currentOrder.id;
                            if(document.getElementById("thisSetPayingFor")) document.getElementById("thisSetPayingFor").value = currentOrder.thisSetPayingFor || "";
                            if(document.getElementById("billPayerPhone")) document.getElementById("billPayerPhone").value = currentOrder.billPayerPhone || "";
                            if(document.getElementById("paymentUpiId")) document.getElementById("paymentUpiId").value = currentOrder.upiId || "N/A";
                            if(document.getElementById("paymentAmount")) document.getElementById("paymentAmount").value = currentOrder.amount;
                            const dropdown = document.getElementById("paymentBottleCount");
                            if(dropdown && Array.from(dropdown.options).some(opt => opt.value == currentOrder.bottles)) {
                                dropdown.value = currentOrder.bottles;
                            }
                        };
                    };
                }
            }
        } else {
            if(document.getElementById("cycleStatus")) document.getElementById("cycleStatus").textContent = "🔄 Running";
            if(payBtn) payBtn.classList.add("hidden");
            if(addBtn) {
                addBtn.classList.remove("hidden");
                addBtn.onclick = () => openBottleCounter(currentOrder.id);
            }
        }
    }

    function openBottleCounter(orderId) {
        const order = orders.find(item => item.id === orderId);
        if (!order) return;

        const date = prompt("Enter Date (DD/MM/YYYY)", new Date().toLocaleDateString("en-IN"));
        if (!date) return;
        const time = prompt("Enter Time", new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
        if (!time) return;

        const used = bottleCounts.filter(item => item.orderId === orderId).length;
        if (used >= order.bottles) { alert("This set cycle is already complete."); return; }

        const bottleNumber = used + 1;
        const record = {
            id: "BC-" + Date.now(),
            orderId: orderId,
            bottleNumber: bottleNumber,
            totalBottles: order.bottles,
            date: date,
            day: getDayName(date),
            time: time
        };

        bottleCounts.unshift(record);
        localStorage.setItem("waterBottleCounts", JSON.stringify(bottleCounts));
        renderDashboard();
    }

    // ==========================================
    // HISTORY MODAL (MONTH & WEEK)
    // ==========================================
    const monthCard = document.getElementById("monthCard");
    const weekCard = document.getElementById("weekCard");
    const historyModal = document.getElementById("historyModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");

    function openModal() { if(historyModal) historyModal.classList.remove("hidden"); }
    if(closeModalBtn) closeModalBtn.addEventListener("click", () => { historyModal.classList.add("hidden"); });

    function getWeekOfMonth(dateObj) {
        const firstDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).getDay();
        return Math.ceil((dateObj.getDate() + firstDay) / 7);
    }
    function getMonthYearString(dateObj) {
        return dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }

    window.deleteMonthHistory = function(monthStrToDelete) {
        if(confirm(`Are you sure you want to delete all bottle counts for ${monthStrToDelete}?`)) {
            bottleCounts = bottleCounts.filter(item => {
                const parts = item.date.split("/");
                const dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
                return getMonthYearString(dateObj) !== monthStrToDelete; 
            });
            localStorage.setItem("waterBottleCounts", JSON.stringify(bottleCounts));
            renderDashboard();
            if(closeModalBtn) closeModalBtn.click(); 
        }
    };

    if(monthCard) {
        monthCard.addEventListener("click", () => {
            if(modalTitle) modalTitle.textContent = "📅 Monthly History";
            if (bottleCounts.length === 0) { modalBody.innerHTML = `<div class="empty-state">No history available.</div>`; } 
            else {
                const grouped = {};
                bottleCounts.forEach(item => {
                    const parts = item.date.split("/");
                    const monthStr = getMonthYearString(new Date(parts[2], parts[1] - 1, parts[0]));
                    if(!grouped[monthStr]) grouped[monthStr] = [];
                    grouped[monthStr].push(item);
                });
                let html = "";
                for (const [month, records] of Object.entries(grouped)) {
                    html += `<div class="history-group">
                                <h4 style="display:flex; justify-content:space-between; align-items:center;">
                                    ${month} 
                                    <div>
                                        <span style="font-size:12px; background:#172033; color:#fff; padding:2px 8px; border-radius:12px; margin-right: 5px;">Total: ${records.length}</span>
                                        <button onclick="deleteMonthHistory('${month}')" style="background:#d9534f; color:#fff; border:none; padding:4px 8px; border-radius:5px; font-size:12px; cursor:pointer;">🗑️ Delete Month</button>
                                    </div>
                                </h4>`;
                    records.forEach(r => { html += `<div class="history-item">✔️ ${r.date} (${r.day}) at ${r.time} - Set: ${r.orderId} - ${r.bottleNumber}${getOrdinal(r.bottleNumber)} Bottle</div>`; });
                    html += `</div>`;
                }
                if(modalBody) modalBody.innerHTML = html;
            }
            openModal();
        });
    }

    if(weekCard) {
        weekCard.addEventListener("click", () => {
            if(modalTitle) modalTitle.textContent = "📆 Weekly History";
            if (bottleCounts.length === 0) { modalBody.innerHTML = `<div class="empty-state">No history available.</div>`; } 
            else {
                const grouped = {};
                bottleCounts.forEach(item => {
                    const parts = item.date.split("/");
                    const dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
                    const weekStr = `Week ${getWeekOfMonth(dateObj)} of ${getMonthYearString(dateObj)}`;
                    if(!grouped[weekStr]) grouped[weekStr] = [];
                    grouped[weekStr].push(item);
                });
                let html = "";
                for (const [week, records] of Object.entries(grouped)) {
                    html += `<div class="history-group">
                                <h4>${week} <span style="float:right; font-size:12px; background:#172033; color:#fff; padding:2px 8px; border-radius:12px;">Total: ${records.length}</span></h4>`;
                    records.forEach(r => { html += `<div class="history-item">✔️ ${r.date} (${r.day}) at ${r.time} - Set: ${r.orderId}</div>`; });
                    html += `</div>`;
                }
                if(modalBody) modalBody.innerHTML = html;
            }
            openModal();
        });
    }


    const upiCard = document.getElementById("upiCard");
    if(upiCard) {
        upiCard.addEventListener("click", () => {
            if(modalTitle) modalTitle.textContent = "🏦 Saved UPI IDs";
            
            // ডুপ্লিকেট রিমুভ করে ইউনিক ইউপিআই আইডিগুলো বের করা
            const uniqueUpis = [...new Set(orders.map(o => o.upiId).filter(id => id && id.trim() !== ""))];

            if (uniqueUpis.length === 0) { 
                modalBody.innerHTML = `<div class="empty-state">No UPI IDs saved yet.</div>`; 
            } else {
                let html = `<div class="history-group"><h4>Your Used UPI IDs</h4>`;
                uniqueUpis.forEach(upi => {
                    const encodedUpi = encodeURIComponent(upi);
                    html += `
                    <div class="history-item" style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 500; color: #0d47a1;">${upi}</span>
                        <button onclick="copyToClipboard(this, '${encodedUpi}')" class="copy-btn" style="padding: 4px 10px; font-size: 13px;">📋 Copy</button>
                    </div>`;
                });
                html += `</div>`;
                if(modalBody) modalBody.innerHTML = html;
            }
            openModal();
        });
    }

    // ==========================================
    // PAYMENT FORM LOGIC & PDF E-RECEIPT
    // ==========================================
    const addPaymentBtn = document.getElementById("addPaymentBtn");
    const paymentForm = document.getElementById("paymentForm");
    const cancelPaymentBtn = document.getElementById("cancelPaymentBtn");
    const savePaymentBtn = document.getElementById("savePaymentBtn");

    function setDefaultPaymentDate() {
        const now = new Date();
        const date = now.toISOString().split("T")[0];
        if(document.getElementById("paymentDate")) document.getElementById("paymentDate").value = date;
        if(document.getElementById("paymentTime")) document.getElementById("paymentTime").value = now.toTimeString().slice(0, 5);
    }

    if(addPaymentBtn) { addPaymentBtn.addEventListener("click", () => { paymentForm.classList.remove("hidden"); setDefaultPaymentDate(); }); }
    if(cancelPaymentBtn) { cancelPaymentBtn.addEventListener("click", () => { paymentForm.classList.add("hidden"); }); }

    if(savePaymentBtn) {
        savePaymentBtn.addEventListener("click", function () {
            const bottleCount = document.getElementById("paymentBottleCount") ? document.getElementById("paymentBottleCount").value : "0";
            const amount = document.getElementById("paymentAmount") ? document.getElementById("paymentAmount").value : "";
            const method = document.getElementById("paymentMethod") ? document.getElementById("paymentMethod").value : "";
            const date = document.getElementById("paymentDate") ? document.getElementById("paymentDate").value : "";
            const time = document.getElementById("paymentTime") ? document.getElementById("paymentTime").value : "";
            const transactionId = document.getElementById("transactionId") ? document.getElementById("transactionId").value.trim() : "";
            
            const thisSetPayingFor = document.getElementById("thisSetPayingFor") ? document.getElementById("thisSetPayingFor").value.trim() : "N/A";
            const billPayerPhone = document.getElementById("billPayerPhone") ? document.getElementById("billPayerPhone").value.trim() : "N/A";
            const setId = document.getElementById("paymentSetId") ? document.getElementById("paymentSetId").value.trim() : "N/A";
            const upiId = document.getElementById("paymentUpiId") ? document.getElementById("paymentUpiId").value.trim() : "N/A";

            if (!amount || !method || !date || !time || !transactionId) { alert("Please fill all required payment details."); return; }

            const payment = {
                id: "PAY-" + Date.now(),
                bottles: Number(bottleCount),
                thisSetPayingFor: thisSetPayingFor || "N/A",
                billPayerPhone: billPayerPhone || "N/A", 
                setId: setId || "N/A",
                upiId: upiId,
                amount: Number(amount),
                method: method,
                date: formatDate(date),
                day: getDayFromISO(date),
                time: time,
                transactionId: transactionId
            };
            payments.unshift(payment);
            localStorage.setItem("waterPayments", JSON.stringify(payments));

            // Update order status to 'Paid' after saving the payment
            let paidOrder = orders.find(o => o.id === setId);
            if (paidOrder) {
                paidOrder.status = "Paid";
                localStorage.setItem("waterOrders", JSON.stringify(orders));
            }

            if(paymentForm) paymentForm.classList.add("hidden");
            
            // FORM FIELDS RESET (Clear all auto-filled data)
            if(document.getElementById("paymentAmount")) document.getElementById("paymentAmount").value = "";
            if(document.getElementById("transactionId")) document.getElementById("transactionId").value = "";
            if(document.getElementById("paymentSetId")) document.getElementById("paymentSetId").value = "";
            if(document.getElementById("paymentUpiId")) document.getElementById("paymentUpiId").value = "";
            if(document.getElementById("thisSetPayingFor")) document.getElementById("thisSetPayingFor").value = "";
            if(document.getElementById("billPayerPhone")) document.getElementById("billPayerPhone").value = "";
            if(document.getElementById("paymentMethod")) document.getElementById("paymentMethod").value = "";
            
            // Reset bottle count in payment form to show "Auto-fills..." placeholder
            if(document.getElementById("paymentBottleCount")) document.getElementById("paymentBottleCount").value = "";
            
            generateEReceipt(payment);
            renderPayments(); 
            renderDashboard();
        });
    }

    function generateEReceipt(payment) {
        if(!window.jspdf) { alert("Payment Saved!\nNote: Could not generate PDF."); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ format: 'a5', orientation: 'portrait' }); 

        doc.setLineWidth(1); doc.setDrawColor(150, 150, 150); doc.rect(5, 5, 138, 145); 
        doc.setFontSize(18); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 136, 229); doc.text("Water Count", 10, 16);
        doc.setFontSize(12); doc.setFont("helvetica", "italic"); doc.setTextColor(211, 47, 47); doc.text("e-Receipt", 10, 22);
        doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100); doc.text("Track. Analyze. Conserve.", 10, 27);

        doc.setFontSize(9); doc.setTextColor(211, 47, 47); doc.text(`Transaction ID : ${payment.transactionId}`, 10, 36); doc.text(`Date : ${payment.date}`, 105, 36);
        doc.setFillColor(76, 175, 80); doc.rect(10, 42, 10, 10, 'F');
        doc.setLineWidth(1.2); doc.setDrawColor(255, 255, 255); doc.line(13, 47, 14.5, 49); doc.line(14.5, 49, 18, 44.5);
        doc.setTextColor(30, 30, 30); doc.setFontSize(9);
        const successMsg = `Thank you, Your payment towards WATER COUNT amounting to\nRs. ${payment.amount}.00 was successful through ${payment.method} paymode.`;
        doc.text(successMsg, 23, 46);

        doc.setLineWidth(0.5); doc.setDrawColor(180, 180, 180); doc.rect(8, 58, 132, 70);
        const startY = 68; const rowH = 9;
        doc.setFontSize(10); doc.text("Payment Details", 39.5, startY - 3, null, null, "center");
        doc.setDrawColor(100, 100, 100); doc.rect(12, startY, 55, rowH * 4); 
        doc.line(12, startY + rowH, 67, startY + rowH); doc.line(12, startY + rowH*2, 67, startY + rowH*2); doc.line(12, startY + rowH*3, 67, startY + rowH*3); doc.line(42, startY, 42, startY + rowH * 4);
        
        doc.setFontSize(8); doc.text("Base Amount", 14, startY + 6); doc.text(`${payment.amount}.00`, 44, startY + 6);
        doc.text("Conv. Fee", 14, startY + rowH + 6); doc.text("0.00", 44, startY + rowH + 6);
        doc.text("GST", 14, startY + rowH*2 + 6); doc.text("0.00", 44, startY + rowH*2 + 6);
        doc.setFont("helvetica", "bold"); doc.text("Total", 14, startY + rowH*3 + 6); doc.text(`${payment.amount}.00`, 44, startY + rowH*3 + 6);

        doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text("Payer Details", 104.5, startY - 3, null, null, "center");
        
        // Render 6 rows for payer details instead of 5
        const rightRows = 6; 
        doc.rect(72, startY, 65, rowH * rightRows); 
        for(let i=1; i<rightRows; i++) { doc.line(72, startY + rowH*i, 137, startY + rowH*i); }
        doc.line(98, startY, 98, startY + rowH * rightRows);
        
        doc.setFontSize(8);
        const rightLabels = ["Set ID", "Total Bottles", "Paying For", "Payer Ph.", "UPI ID", "Time"]; // Added UPI ID label
        const rightValues = [payment.setId, `${payment.bottles} Bottles`, payment.thisSetPayingFor, payment.billPayerPhone, payment.upiId, payment.time]; // Added UPI ID value
        for(let i=0; i<rightRows; i++) {
            doc.setFont("helvetica", "normal"); doc.text(rightLabels[i], 74, startY + (rowH*i) + 6);
            let val = rightValues[i] || "N/A"; if(val.length > 20) val = val.substring(0, 18) + "..."; 
            doc.text(val, 100, startY + (rowH*i) + 6);
        }
        doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.setTextColor(120, 120, 120); doc.text("This is an automatically generated e-receipt.", 74, 140, null, null, "center");
        doc.save(`E-Receipt_${payment.setId}.pdf`);
    }

    function renderPayments() {
        const container = document.getElementById("paymentHistoryContainer");
        if (!container) return;
        if (payments.length === 0) { container.innerHTML = `<div class="empty-state">No payment records yet.</div>`; return; }
        container.innerHTML = payments.map(payment => {
            return `
                <div class="payment-card">
                    <div class="payment-icon">💰</div>
                    <div class="payment-info">
                        <h3>${payment.bottles} Bottle${payment.bottles > 1 ? "s" : ""} - ${payment.thisSetPayingFor}</h3>
                        <p>${payment.method}</p>
                        <p>${payment.date} - ${payment.day} - ${payment.time}</p>
                        <p style="color: #4a90e2; font-size: 11px;">Set ID: ${payment.setId} | Payer Ph: ${payment.billPayerPhone}</p>
                    </div>
                    <div class="payment-amount">
                        <strong>₹${payment.amount}</strong>
                        <span class="paid">✓ Recorded</span>
                    </div>
                </div>`;
        }).join("");
    }

    // ==========================================
    // HELPERS & DELETE DATA
    // ==========================================
    function getDayName(dateString) { const date = new Date(dateString.split("/").reverse().join("-")); return date.toLocaleDateString("en-US", { weekday: "long" }); }
    function getOrdinal(number) { if (number === 1) return "st"; if (number === 2) return "nd"; if (number === 3) return "rd"; return "th"; }
    function formatDate(date) { const parts = date.split("-"); return parts.length === 3 ? parts[2] + "/" + parts[1] + "/" + parts[0] : date; }
    function getDayFromISO(dateString) { return new Date(dateString + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" }); }

    const deleteAllHistoryBtn = document.getElementById("deleteAllHistoryBtn");
    if(deleteAllHistoryBtn) {
        deleteAllHistoryBtn.addEventListener("click", () => {
            if(confirm("Are you sure you want to delete ALL data?")) {
                orders = []; payments = []; bottleCounts = [];
                localStorage.clear();
                renderDashboard(); renderPayments();
                alert("All data deleted!");
            }
        });
    }

    setDefaultOrderDate(); renderPayments(); renderDashboard();
    history.replaceState({ page: "dashboard" }, "dashboard", "#dashboard");
    showView("dashboard", false);
});