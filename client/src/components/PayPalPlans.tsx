import { useEffect } from "react";

interface PayPalPlansProps {
  onPaymentSuccess?: (planType: 'weekly' | 'monthly') => void;
}

export default function PayPalPlans({ onPaymentSuccess }: PayPalPlansProps) {
  useEffect(() => {
    const loadPayPalSDK = async () => {
      try {
        if (!(window as any).paypal) {
          const script = document.createElement("script");
          script.src = import.meta.env.PROD
            ? "https://www.paypal.com/web-sdk/v6/core"
            : "https://www.sandbox.paypal.com/web-sdk/v6/core";
          script.async = true;
          script.onload = () => initPayPalButtons();
          document.body.appendChild(script);
        } else {
          await initPayPalButtons();
        }
      } catch (e) {
        console.error("Failed to load PayPal SDK", e);
      }
    };

    loadPayPalSDK();
  }, []);

  const initPayPalButtons = async () => {
    try {
      const clientToken: string = await fetch("/paypal/setup")
        .then((res) => res.json())
        .then((data) => data.clientToken);

      const sdkInstance = await (window as any).paypal.createInstance({
        clientToken,
        components: ["paypal-payments"],
      });

      // Weekly plan button
      const weeklyButton = document.getElementById("paypal-weekly-button");
      if (weeklyButton) {
        weeklyButton.innerHTML = "";
        const weeklyCheckout = sdkInstance.createPayPalOneTimePaymentSession({
          onApprove: async (data: any) => {
            console.log("Weekly plan approved", data);
            const orderData = await captureOrder(data.orderId);
            console.log("Weekly plan capture result", orderData);
            onPaymentSuccess?.('weekly');
          },
          onCancel: (data: any) => console.log("Weekly plan cancelled", data),
          onError: (data: any) => console.log("Weekly plan error", data),
        });

        const weeklyPayPalButton = document.createElement("paypal-button");
        weeklyPayPalButton.id = "paypal-weekly-btn";
        weeklyPayPalButton.style.cssText = "width: 120px; height: 35px;";
        weeklyPayPalButton.addEventListener("click", async () => {
          try {
            const orderPromise = createOrder("1.99", "USD", "CAPTURE");
            await weeklyCheckout.start({ paymentFlow: "auto" }, orderPromise);
          } catch (e) {
            console.error("Weekly payment error:", e);
          }
        });
        weeklyButton.appendChild(weeklyPayPalButton);
      }

      // Monthly plan button
      const monthlyButton = document.getElementById("paypal-monthly-button");
      if (monthlyButton) {
        monthlyButton.innerHTML = "";
        const monthlyCheckout = sdkInstance.createPayPalOneTimePaymentSession({
          onApprove: async (data: any) => {
            console.log("Monthly plan approved", data);
            const orderData = await captureOrder(data.orderId);
            console.log("Monthly plan capture result", orderData);
            onPaymentSuccess?.('monthly');
          },
          onCancel: (data: any) => console.log("Monthly plan cancelled", data),
          onError: (data: any) => console.log("Monthly plan error", data),
        });

        const monthlyPayPalButton = document.createElement("paypal-button");
        monthlyPayPalButton.id = "paypal-monthly-btn";
        monthlyPayPalButton.style.cssText = "width: 120px; height: 35px;";
        monthlyPayPalButton.addEventListener("click", async () => {
          try {
            const orderPromise = createOrder("3.45", "USD", "CAPTURE");
            await monthlyCheckout.start({ paymentFlow: "auto" }, orderPromise);
          } catch (e) {
            console.error("Monthly payment error:", e);
          }
        });
        monthlyButton.appendChild(monthlyPayPalButton);
      }
    } catch (e) {
      console.error("PayPal initialization error:", e);
    }
  };

  const createOrder = async (amount: string, currency: string, intent: string) => {
    const response = await fetch("/paypal/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, currency, intent }),
    });
    const output = await response.json();
    return { orderId: output.id };
  };

  const captureOrder = async (orderId: string) => {
    const response = await fetch(`/paypal/order/${orderId}/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return await response.json();
  };

  return (
    <div className="paypal-plans">
      <style jsx>{`
        .paypal-button-container {
          display: inline-block;
        }
        paypal-button {
          display: inline-block;
          cursor: pointer;
          background: #0070ba;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          text-align: center;
          text-decoration: none;
          transition: background-color 0.2s;
        }
        paypal-button:hover {
          background: #005ea6;
        }
        paypal-button:active {
          background: #004a87;
        }
      `}</style>
    </div>
  );
}