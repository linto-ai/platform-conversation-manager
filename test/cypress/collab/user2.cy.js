describe("Edition 2nd user", () => {
  it("edit turn", () => {
    cy.login("foo.bar@example.com", "password")

    cy.get(".conversation-line__head .conversation-line__title").first().click()

    cy.get("#conversation-is-loading", { timeout: 10000 }).should("not.exist")

    cy.wait(50)

    cy.get("#ea23dcfb-bf02-43e4-ad95-eb139e6bbeee").realClick()

    cy.wait(50)

    cy.realType("mot4 mot5 mot6")

    cy.get(".organization-sidebar").click()

    cy.wait(500)

    cy.get("sync-error-icon").should("not.exist")

    // cy.contains("Ça va très bimot4 mot5 mot6en depuis combien de temps ?")

    // cy.wait(200)
    // cy.contains("Ça va très bimot4 mot5 mot6en depuis combien de temps ?")
    // cy.contains("Ça va trèmot1 mot2 mot3s bien.")

    // cy.get("#0ce5a4ef-6367-427b-a6e2-f5da523dfb0e").realClick()
    // cy.realType("mot4 mot5 mot6 mot7 mot8")
    // cy.wait(200)
    // cy.contains("Depuis qumot1 mot2 mot3 mot31 mot32e j'ai quitté une certmot4 mot5 mot6 mot7 mot8aine presse.")
  })
})
