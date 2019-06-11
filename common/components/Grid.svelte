<script>
let reportDate = "June 2019";
let totalAmount = "$30,000";
let tableColumns = ["Name", "Status", "Date", "Price"];
let tableData = [
{
  itemName: "UI consulting services",
  status: "Shipped",
  date: "12 Jun 2019",
  price: "9500 EUR"
},
{
  itemName: "Lean startup consulting",
  status: "Pending pay",
  date: "15 Jun 2019",
  price: "8300 USD"
},
{
  itemName: "MVP development",
  status: "Shipped",
  date: "17 Jun 2019",
  price: "18600 USD"
},
{
  itemName: "Consulting services - hourly",
  status: "Shipped",
  date: "18 Jun 2019",
  price: "1000 USD"
},
{
  itemName: "Consulting services - project",
  status: "Shipped",
  date: "20 Jun 2019",
  price: "1200 USD"
},
]

function getRandomBadge() {
  let possibleBadgeValues =
                 ["badge bgc-red-50 c-red-700 p-10 lh-0 tt-c badge-pill",
                  "badge bgc-deep-purple-50 c-deep-purple-700 p-10 lh-0 tt-c badge-pill",
                  "badge bgc-pink-50 c-pink-700 p-10 lh-0 tt-c badge-pill",
                  "badge bgc-green-50 c-green-700 p-10 lh-0 tt-c badge-pill",
                  "badge bgc-red-50 c-red-700 p-10 lh-0 tt-c badge-pill",
                  "badge bgc-orange-50 c-orange-700 p-10 lh-0 tt-c badge-pill"
                ];
  return possibleBadgeValues[Math.floor(Math.random()*possibleBadgeValues.length)];
}
</script>

<div style="padding: 70px;" class="masonry-item col-md-6">
    <div class="bd bgc-white">
        <div class="layers">
            <div class="layer w-100 p-20">
                <h6 class="lh-1">Sales Report</h6></div>
            <div class="layer w-100">
                <div class="bgc-light-blue-500 c-white p-20">
                    <div class="peers ai-c jc-sb gap-40">
                        <div class="peer peer-greed">
                            <h5>{reportDate}</h5>
                            <p class="mB-0">Sales Report</p>
                        </div>
                        <div class="peer">
                            <h3 class="text-right">{totalAmount}</h3></div>
                    </div>
                </div>
                <div class="table-responsive p-20">
                    <table class="table">
                        <thead>
                            <tr>
                                {#each tableColumns as { id, name }, i}
                                <th class="bdwT-0">{tableColumns[i]}</th>
                                {/each}
                            </tr>
                        </thead>
                        <tbody>
                            {#each tableData as { id, name }, i}
                            <tr>
                                <td class="fw-600">{ tableData[i].itemName }</td>
                                <td><span class=" { getRandomBadge() } ">{ tableData[i].status }</span></td>
                                <td>{ tableData[i].date }</td>
                                <td><span class="text-success">{ tableData[i].price }</span></td>
                            </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div class="ta-c bdT w-100 p-20"><a href="https://dashboardhero.net">Check all the sales</a></div>
    </div>
</div>
