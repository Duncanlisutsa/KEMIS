import { useEffect, useState } from "react";
import api from "../services/api";

function Payments() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await api.get("payments/");
      setPayments(response.data);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  return (
    <div>
      <h1>Payments</h1>

      <table border="1" cellPadding="10" width="100%">
        <thead>
          <tr>
            <th>Lease</th>
            <th>Amount</th>
            <th>Payment Date</th>
            <th>Method</th>
            <th>Type</th>
            <th>Reference</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>{payment.lease}</td>
              <td>KES {payment.amount}</td>
              <td>{payment.payment_date}</td>
              <td>{payment.payment_method}</td>
              <td>{payment.payment_type}</td>
              <td>{payment.reference_number}</td>
              <td>{payment.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Payments;