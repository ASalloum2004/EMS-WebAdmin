import { useMemo, type FormEvent } from "react";
import {
  ModalCloseButton,
  SearchFilterBar,
  TableFooter,
} from "../../../../components";
import { useI18n } from "../../../../i18n";
import { useServices } from "../../hooks";
import "./ManagementServicesModal.scss";

const SERVICES_PER_PAGE = 3;

interface ManagementServicesModalProps {
  onClose: () => void;
}

export function ManagementServicesModal({
  onClose,
}: ManagementServicesModalProps) {
  const { t } = useI18n();
  const validationMessages = useMemo(
    () => ({
      invalidPrice: t.management.servicesModal.invalidPrice,
      nameRequired: t.management.servicesModal.nameRequired,
      negativePrice: t.management.servicesModal.negativePrice,
      priceRequired: t.management.servicesModal.priceRequired,
      statusRequired: t.management.servicesModal.statusRequired,
    }),
    [
      t.management.servicesModal.invalidPrice,
      t.management.servicesModal.nameRequired,
      t.management.servicesModal.negativePrice,
      t.management.servicesModal.priceRequired,
      t.management.servicesModal.statusRequired,
    ],
  );
  const {
    services,
    isLoading,
    error,
    currentPage,
    setCurrentPage,
    perPage,
    totalItems,
    searchName,
    setSearchName,
    serviceForm,
    openCreate,
    openEdit,
    closeForm,
    submitForm,
    isSubmitting,
    isSaveDisabled,
    formStatusMessage,
  } = useServices({
    enabled: true,
    initialPerPage: SERVICES_PER_PAGE,
    validationMessages,
  });

  const formTitle =
    serviceForm.mode === "edit"
      ? t.management.servicesModal.editTitle
      : t.management.servicesModal.addTitle;

  function handleSearchChange(value: string) {
    setSearchName(value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaveDisabled) {
      return;
    }

    await submitForm();
  }

  return (
    <div className="management-services-modal" role="presentation">
      <div
        className="management-services-modal__backdrop"
        onClick={onClose}
      />

      <section
        className="management-services-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="management-services-title"
        aria-describedby="management-services-description"
      >
        <header className="management-services-modal__header">
          <div className="management-services-modal__copy">
            <h2 id="management-services-title">
              {t.management.servicesModal.title}
            </h2>
            <p id="management-services-description">
              {t.management.servicesModal.description}
            </p>
          </div>

          <ModalCloseButton ariaLabel={t.common.close} onClick={onClose} />
        </header>

        <div className="management-services-modal__toolbar">
          <SearchFilterBar
            className="management-services-modal__search"
            value={searchName}
            onChange={handleSearchChange}
            placeholder={t.management.servicesModal.searchPlaceholder}
            inputAriaLabel={t.management.servicesModal.searchAriaLabel}
            filterLabel={t.management.servicesModal.filter}
            filterAriaLabel={t.management.servicesModal.filterAriaLabel}
            showFilterButton
          />

          <button
            className="management-services-modal__add-button"
            type="button"
            onClick={openCreate}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <path d="M10 3.25c.41 0 .75.34.75.75v5.25H16a.75.75 0 0 1 0 1.5h-5.25V16a.75.75 0 0 1-1.5 0v-5.25H4a.75.75 0 0 1 0-1.5h5.25V4c0-.41.34-.75.75-.75Z" />
            </svg>
            <span>{t.management.servicesModal.addService}</span>
          </button>
        </div>

        {serviceForm.isOpen ? (
          <form
            className="management-services-modal__form"
            aria-label={formTitle}
            onSubmit={handleSubmit}
          >
            <div className="management-services-modal__form-header">
              <h3>{formTitle}</h3>
              {serviceForm.selectedService ? (
                <span>#{serviceForm.selectedService.id}</span>
              ) : null}
            </div>

            <div className="management-services-modal__form-grid">
              <label className="management-services-modal__field">
                <span>{t.management.servicesModal.serviceName}</span>
                <input
                  type="text"
                  value={serviceForm.values.name}
                  onChange={(event) =>
                    serviceForm.updateField("name", event.target.value)
                  }
                />
              </label>

              <label className="management-services-modal__field">
                <span>{t.management.servicesModal.price}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={serviceForm.values.price}
                  onChange={(event) =>
                    serviceForm.updateField("price", event.target.value)
                  }
                />
              </label>

              {serviceForm.mode === "edit" ? (
                <label className="management-services-modal__toggle">
                  <input
                    type="checkbox"
                    checked={serviceForm.values.isActive}
                    onChange={(event) =>
                      serviceForm.updateField("isActive", event.target.checked)
                    }
                  />
                  <span>{t.management.servicesModal.active}</span>
                </label>
              ) : null}
            </div>

            {formStatusMessage ? (
              <p
                className="management-services-modal__form-message"
                role="alert"
              >
                {formStatusMessage}
              </p>
            ) : null}

            <div className="management-services-modal__form-actions">
              <button
                className="management-services-modal__button management-services-modal__button--secondary"
                type="button"
                onClick={closeForm}
              >
                {t.management.servicesModal.cancel}
              </button>
              <button
                className="management-services-modal__button management-services-modal__button--primary"
                type="submit"
                disabled={isSaveDisabled}
              >
                {isSubmitting ? t.common.saving : t.management.servicesModal.save}
              </button>
            </div>
          </form>
        ) : null}

        <div
          className="management-services-modal__table"
          role="table"
          aria-label={t.management.servicesModal.title}
        >
          <div
            className="management-services-modal__table-head"
            role="rowgroup"
          >
            <div className="management-services-modal__row" role="row">
              <div role="columnheader">
                {t.management.servicesModal.serviceName}
              </div>
              <div role="columnheader">{t.management.servicesModal.price}</div>
              <div role="columnheader">{t.management.servicesModal.status}</div>
              <div role="columnheader">
                {t.management.servicesModal.actions}
              </div>
            </div>
          </div>

          <div
            className="management-services-modal__table-body"
            role="rowgroup"
          >
            {services.map((service) => {
              const statusLabel = service.is_active
                ? t.management.servicesModal.active
                : t.management.servicesModal.inactive;
              const statusClassName = service.is_active
                ? "management-services-modal__status management-services-modal__status--active"
                : "management-services-modal__status management-services-modal__status--inactive";

              return (
                <div
                  className="management-services-modal__row"
                  role="row"
                  key={service.id}
                >
                  <div
                    className="management-services-modal__cell management-services-modal__cell--primary"
                    role="cell"
                    data-label={t.management.servicesModal.serviceName}
                  >
                    {service.name}
                  </div>
                  <div
                    className="management-services-modal__cell"
                    role="cell"
                    data-label={t.management.servicesModal.price}
                  >
                    {String(service.price)}
                  </div>
                  <div
                    className="management-services-modal__cell"
                    role="cell"
                    data-label={t.management.servicesModal.status}
                  >
                    <span className={statusClassName}>{statusLabel}</span>
                  </div>
                  <div
                    className="management-services-modal__cell management-services -modal__cell--action"
                    role="cell"
                    data-label={t.management.servicesModal.actions}
                  >
                    <button
                      className="management-services-modal__edit-button"
                      type="button"
                      onClick={() => openEdit(service)}
                    >
                      {t.management.servicesModal.edit}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <TableFooter
          currentPage={currentPage}
          perPage={perPage}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
        />

        {isLoading ? (
          <p className="management-services-modal__empty">
            {t.management.servicesModal.loading}
          </p>
        ) : null}

        {error ? (
          <p className="management-services-modal__empty" role="alert">
            {error || t.management.servicesModal.loadError}
          </p>
        ) : null}

        {!isLoading && !error && !services.length ? (
          <p className="management-services-modal__empty">
            {t.management.servicesModal.empty}
          </p>
        ) : null}
      </section>
    </div>
  );
}
